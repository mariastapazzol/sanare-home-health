import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Step = 'caregiver' | 'patient';

const AuthSignupCaregiver = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>('caregiver');
  const [loading, setLoading] = useState(false);
  
  const [caregiverData, setCaregiverData] = useState({
    nome: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [patientData, setPatientData] = useState({
    nome: '',
    username: ''
  });

  useEffect(() => {
    // Check if user is already authenticated
    if (user && currentStep === 'caregiver') {
      setCurrentStep('patient');
    }
  }, [user, currentStep]);

  const handleCaregiverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (caregiverData.password !== caregiverData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUp(caregiverData.email, caregiverData.password, caregiverData.nome);
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cuidador cadastrado!",
          description: "Agora cadastre o paciente"
        });
        setCurrentStep('patient');
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('dependentes')
        .insert({
          user_id: user.id,
          nome: patientData.nome,
          nome_usuario: patientData.username,
          observacoes: null
        });

      if (error) {
        toast({
          title: "Erro ao cadastrar paciente",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Paciente cadastrado com sucesso!",
          description: "Redirecionando para a página inicial..."
        });
        
        setTimeout(() => {
          navigate('/home');
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleCaregiverChange = (field: string, value: string) => {
    setCaregiverData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (field: string, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (currentStep === 'patient') {
      setCurrentStep('caregiver');
    } else {
      navigate('/auth/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <button 
            onClick={handleBack}
            className="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-2xl font-bold">
            {currentStep === 'caregiver' ? 'Etapa 1 de 2' : 'Etapa 2 de 2'}
          </h1>
          <p className="text-mobile-base text-muted-foreground">
            {currentStep === 'caregiver' ? 'Dados do Cuidador' : 'Dados do Paciente'}
          </p>
        </div>

        {/* Forms */}
        <Card className="card-health">
          {currentStep === 'caregiver' ? (
            <form onSubmit={handleCaregiverSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  type="text"
                  value={caregiverData.nome}
                  onChange={(e) => handleCaregiverChange('nome', e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={caregiverData.email}
                  onChange={(e) => handleCaregiverChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nome de usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={caregiverData.username}
                  onChange={(e) => handleCaregiverChange('username', e.target.value)}
                  placeholder="usuario123"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={caregiverData.password}
                  onChange={(e) => handleCaregiverChange('password', e.target.value)}
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
                  value={caregiverData.confirmPassword}
                  onChange={(e) => handleCaregiverChange('confirmPassword', e.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  className="min-h-[44px]"
                />
                {caregiverData.password !== caregiverData.confirmPassword && caregiverData.confirmPassword && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit" 
                  className="btn-health flex-1"
                  disabled={loading || caregiverData.password !== caregiverData.confirmPassword}
                >
                  {loading ? 'Salvando...' : 'Próximo'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePatientSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="patientNome">Nome do paciente</Label>
                <Input
                  id="patientNome"
                  type="text"
                  value={patientData.nome}
                  onChange={(e) => handlePatientChange('nome', e.target.value)}
                  placeholder="Nome completo do paciente"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientUsername">Nome de usuário do paciente</Label>
                <Input
                  id="patientUsername"
                  type="text"
                  value={patientData.username}
                  onChange={(e) => handlePatientChange('username', e.target.value)}
                  placeholder="usuario_paciente"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Voltar
                </Button>
                
                <Button 
                  type="submit" 
                  className="btn-health flex-1"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Concluir'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthSignupCaregiver;