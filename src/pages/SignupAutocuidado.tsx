import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SignupAutocuidado = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const formatDateToBR = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatDateToISO = (dateString: string) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the auth user
      const { error: authError } = await signUp(formData.email, formData.password, formData.name);
      
      if (authError) {
        setLoading(false);
        return;
      }

      // Wait for session
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Verificar se já existe em outras tabelas (evitar duplicação)
          const [{ data: existeCuidador }, { data: existeDependente }] = await Promise.all([
            supabase.from('cuidadores').select('id').eq('user_id', session.user.id).maybeSingle(),
            supabase.from('pacientes_dependentes').select('id').eq('user_id', session.user.id).maybeSingle()
          ]);

          if (existeCuidador || existeDependente) {
            toast({
              title: "Erro",
              description: "Este usuário já possui um cadastro em outro papel.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            navigate('/auth/choice');
            setLoading(false);
            return;
          }

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: session.user.id,
              name: formData.name,
              username: formData.email.split('@')[0],
              email: formData.email,
              birth_date: formData.birth_date || null
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            toast({
              title: "Erro",
              description: "Falha ao criar perfil.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            navigate('/auth/choice');
            setLoading(false);
            return;
          }

          // Insert role in user_roles table (security)
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: session.user.id,
              role: 'paciente_autonomo'
            });

          if (roleError) {
            console.error('Error assigning role:', roleError);
            toast({
              title: "Erro",
              description: "Falha ao atribuir papel.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            navigate('/auth/choice');
            setLoading(false);
            return;
          }

          // Criar registro em pacientes_autonomos (tabela correta)
          const { error: autonomoError } = await supabase
            .from('pacientes_autonomos')
            .insert({
              user_id: session.user.id,
              nome: formData.name,
              nome_usuario: formData.email.split('@')[0],
              nascimento: formData.birth_date || null
            });

          if (autonomoError) {
            console.error('Error creating paciente_autonomo:', autonomoError);
            toast({
              title: "Erro",
              description: "Falha ao salvar dados do perfil.",
              variant: "destructive"
            });
            await supabase.auth.signOut();
            navigate('/auth/choice');
            setLoading(false);
            return;
          }

          toast({
            title: "Sucesso!",
            description: "Conta criada com sucesso.",
          });
        }
        
        navigate('/home');
        setLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <button 
            onClick={() => navigate('/auth/choice')}
            className="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-2xl font-bold">Autocuidado</h1>
          <p className="text-mobile-base text-muted-foreground">
            Preencha seus dados
          </p>
        </div>

        <Card className="card-health">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Seu nome completo"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="seu@email.com"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirme sua senha"
                required
                className="min-h-[44px]"
              />
              {formData.password !== formData.confirmPassword && formData.confirmPassword && (
                <p className="text-sm text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => navigate('/auth/choice')}
                className="flex-1"
              >
                Voltar
              </Button>
              
              <Button 
                type="submit" 
                className="btn-health flex-1"
                disabled={loading || formData.password !== formData.confirmPassword}
              >
                {loading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignupAutocuidado;
