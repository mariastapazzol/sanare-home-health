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

const AuthSignup = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    nascimento: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

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
    
    setLoading(true);
    
    try {
      // First create the auth user
      const { error: authError } = await signUp(formData.email, formData.password, formData.nome);
      
      if (authError) {
        setLoading(false);
        return;
      }

      // Wait a bit for the user to be created and get the session
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Create patient record
          const { error: patientError } = await supabase
            .from('pacientes_autonomos')
            .insert({
              user_id: session.user.id,
              nome: formData.nome,
              nome_usuario: formData.email.split('@')[0], // Use email prefix as username
              nascimento: formData.nascimento || null
            });

          if (patientError) {
            console.error('Error creating patient record:', patientError);
            toast({
              title: "Aviso",
              description: "Conta criada, mas houve um problema ao salvar os dados adicionais.",
              variant: "destructive"
            });
          }
        }
        
        navigate('/auth');
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
        {/* Header */}
        <div className="text-center space-y-4">
          <button 
            onClick={() => navigate('/')}
            className="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-2xl font-bold">Criar Conta</h1>
          <p className="text-mobile-base text-muted-foreground">
            Preencha seus dados
          </p>
        </div>

        {/* Signup Form */}
        <Card className="card-health">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nascimento">Data de nascimento</Label>
              <Input
                id="nascimento"
                type="date"
                value={formData.nascimento}
                onChange={(e) => handleChange('nascimento', e.target.value)}
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
                placeholder="Sua senha"
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
                onClick={() => navigate('/auth')}
                className="flex-1"
              >
                Cancelar
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

        {/* Footer */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Button 
              variant="link" 
              onClick={() => navigate('/auth')}
              className="text-primary hover:text-primary-dark p-0 h-auto"
            >
              Fazer login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSignup;