import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toISODate(d: string): string | null {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [a, b, c] = d.split("/");
    const dd = parseInt(a, 10);
    const mm = parseInt(b, 10);
    const yyyy = c;
    const [month, day] = dd > 12 ? [mm, dd] : [dd, mm];
    return `${yyyy}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const dt = new Date(d);
  if (!isNaN(+dt)) return dt.toISOString().slice(0, 10);
  return null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SERVICE_ROLE' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Get the authorization header to verify the caregiver
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caregiver's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caregiver }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caregiver) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Caregiver authenticated:', caregiver.id);

    // Verify user is actually a caregiver
    const { data: cgRow, error: cgErr } = await supabaseAdmin
      .from('cuidadores')
      .select('id')
      .eq('user_id', caregiver.id)
      .maybeSingle();

    if (cgErr) {
      return new Response(
        JSON.stringify({ error: cgErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!cgRow) {
      return new Response(
        JSON.stringify({ error: 'Apenas cuidadores podem criar dependentes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body - NO EMAIL REQUIRED
    const { name, username, birth_date, password, observacoes } = await req.json();

    // Validate required fields
    if (!name || !username || !birth_date || !password) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username format
    const usernameRegex = /^[A-Za-z0-9._]{3,}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Username inválido. Use letras, números, ponto ou underline (mín. 3).' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize birth date
    const isoBirth = toISODate(birth_date);
    if (!isoBirth) {
      return new Response(
        JSON.stringify({ error: 'Data de nascimento inválida. Use YYYY-MM-DD.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check username uniqueness (case-insensitive)
    const { data: existing } = await supabaseAdmin
      .from('pacientes_dependentes')
      .select('id')
      .ilike('nome_usuario', username)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Nome de usuário já em uso.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate shadow email for auth
    const shadowEmail = `${username.toLowerCase()}@dep.sanare.local`;

    console.log('Creating dependent user with shadow email:', shadowEmail);

    // Create the dependent user account with shadow email
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: shadowEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'paciente_dependente',
        username
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

    // Insert into pacientes_dependentes table
    const { error: depError } = await supabaseAdmin
      .from('pacientes_dependentes')
      .insert({
        user_id: newUser.user.id,
        cuidador_id: caregiver.id,
        nome: name,
        nome_usuario: username,
        nascimento: isoBirth,
        observacoes: observacoes ?? null
      });

    if (depError) {
      console.error('Error creating dependent record:', depError);
      // If dependent creation fails, delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create dependent: ' + depError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Dependent record created');

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
