import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Get the authorization header to verify the caregiver
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the caregiver's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caregiver }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caregiver) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Caregiver authenticated:', caregiver.id);

    // Parse request body
    const { name, username, birth_date, email, password } = await req.json();

    // Validate required fields
    if (!name || !username || !birth_date || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9._]{3,}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Nome de usuário inválido. Use apenas letras minúsculas, números, pontos e underscores (mínimo 3 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating dependent user...');

    // Create the dependent user account
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        username,
        birth_date
      }
    });

    if (createUserError || !newUser.user) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', newUser.user.id);

    // Create the profile for the dependent
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: newUser.user.id,
        role: 'dependente',
        caregiver_user_id: caregiver.id,
        name,
        username,
        birth_date,
        email
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // If profile creation fails, delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile created');

    // Create the care context for the dependent
    const { error: contextError } = await supabaseAdmin
      .from('care_contexts')
      .insert({
        owner_user_id: newUser.user.id,
        caregiver_user_id: caregiver.id,
        type: 'dependent'
      });

    if (contextError) {
      console.error('Error creating care context:', contextError);
      return new Response(
        JSON.stringify({ error: 'Failed to create care context: ' + contextError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Care context created');

    return new Response(
      JSON.stringify({ 
        success: true, 
        dependent_user_id: newUser.user.id,
        message: 'Dependente criado com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
