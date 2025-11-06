import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SignupCuidador = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: formData.name,
            birth_date: formData.birthDate,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile role to cuidador
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'cuidador' })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Error updating profile role:', profileError);
      }

      // Update user role to cuidador (trigger creates as paciente_autonomo by default)
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'cuidador' })
        .eq('user_id', authData.user.id)
        .eq('role', 'paciente_autonomo');

      if (roleError) {
        console.error('Error updating role:', roleError);
      }

      // Delete pacientes_autonomos record (created by trigger)
      await supabase
        .from('pacientes_autonomos')
        .delete()
        .eq('user_id', authData.user.id);

      // Delete self care context (created by trigger, not needed for caregivers)
      await supabase
        .from('care_contexts')
        .delete()
        .eq('owner_user_id', authData.user.id)
        .eq('tipo', 'self');

      // Create cuidador record
      const { error: cuidadorError } = await supabase
        .from('cuidadores')
        .insert({
          user_id: authData.user.id,
          nome: formData.name,
          nome_usuario: formData.email.split('@')[0],
          nascimento: formData.birthDate || null,
        });

      if (cuidadorError) {
        console.error('Error creating cuidador:', cuidadorError);
        throw new Error('Database error saving caregiver');
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Agora vamos cadastrar o dependente.",
      });

      navigate('/auth/signup-dependente');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Erro ao criar conta';
      
      if (error.message?.includes('already registered')) {
        errorMessage = 'Este e-mail já está cadastrado';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'A senha deve ter pelo menos 8 caracteres';
      } else if (error.message?.includes('Database error')) {
        errorMessage = 'Erro ao salvar dados. Verifique se o e-mail já está cadastrado.';
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setLoading(false);
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
          <h1 className="text-mobile-2xl font-bold">Etapa 1: Cuidador</h1>
          <p className="text-mobile-base text-muted-foreground">
            Primeiro, crie sua conta de cuidador
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
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="min-h-[44px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  className="min-h-[44px] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                {loading ? 'Criando conta...' : 'Avançar'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignupCuidador;
