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
    username: '',
    password: '',
    confirmPassword: ''
  });
  
  const [caregiverId, setCaregiverId] = useState<string | null>(null);

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
      const { error: authError } = await signUp(caregiverData.email, caregiverData.password, caregiverData.nome);
      
      if (authError) {
        toast({
          title: "Erro no cadastro",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      // Get current user to save caregiver data
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado após cadastro",
          variant: "destructive"
        });
        return;
      }

      // Save caregiver data to cuidadores table
      const { data: caregiverRecord, error: caregiverError } = await supabase
        .from('cuidadores')
        .insert({
          user_id: currentUser.id,
          nome: caregiverData.nome,
          nome_usuario: caregiverData.username
        })
        .select()
        .single();

      if (caregiverError) {
        toast({
          title: "Erro ao salvar dados do cuidador",
          description: caregiverError.message,
          variant: "destructive"
        });
        return;
      }

      setCaregiverId(caregiverRecord.id);
      toast({
        title: "Cuidador cadastrado!",
        description: "Agora cadastre o paciente"
      });
      setCurrentStep('patient');
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
    
    if (!caregiverId) {
      toast({
        title: "Erro",
        description: "ID do cuidador não encontrado",
        variant: "destructive"
      });
      return;
    }

    if (patientData.password !== patientData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a new user for the patient
      const { data: patientAuth, error: authError } = await supabase.auth.signUp({
        email: `${patientData.username}@temp.com`, // Temporary email format
        password: patientData.password,
        options: {
          data: {
            nome: patientData.nome
          }
        }
      });

      if (authError) {
        toast({
          title: "Erro ao criar conta do paciente",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      if (!patientAuth.user) {
        toast({
          title: "Erro",
          description: "Usuário do paciente não foi criado",
          variant: "destructive"
        });
        return;
      }

      // Save patient data to pacientes_dependentes table
      const { error: patientError } = await supabase
        .from('pacientes_dependentes')
        .insert({
          user_id: patientAuth.user.id,
          cuidador_id: caregiverId,
          nome: patientData.nome,
          nome_usuario: patientData.username
        });

      if (patientError) {
        toast({
          title: "Erro ao cadastrar paciente",
          description: patientError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Paciente cadastrado com sucesso!",
        description: "Redirecionando para a página inicial..."
      });
      
      setTimeout(() => {
        navigate('/home');
      }, 1500);
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

              <div className="space-y-2">
                <Label htmlFor="patientPassword">Senha do paciente</Label>
                <Input
                  id="patientPassword"
                  type="password"
                  value={patientData.password}
                  onChange={(e) => handlePatientChange('password', e.target.value)}
                  placeholder="Senha do paciente"
                  required
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientConfirmPassword">Confirmar senha</Label>
                <Input
                  id="patientConfirmPassword"
                  type="password"
                  value={patientData.confirmPassword}
                  onChange={(e) => handlePatientChange('confirmPassword', e.target.value)}
                  placeholder="Confirme a senha"
                  required
                  className="min-h-[44px]"
                />
                {patientData.password !== patientData.confirmPassword && patientData.confirmPassword && (
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
                  Voltar
                </Button>
                
                <Button 
                  type="submit" 
                  className="btn-health flex-1"
                  disabled={loading || patientData.password !== patientData.confirmPassword}
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