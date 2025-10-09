import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Step = 'identify' | 'reset' | 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('identify');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Validação de senha
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'A senha deve ter no mínimo 8 caracteres';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'A senha deve conter pelo menos 1 letra';
    }
    if (!/[0-9]/.test(password)) {
      return 'A senha deve conter pelo menos 1 número';
    }
    return null;
  };

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = identifier.trim();

      // Se não for email, converter username para email shadow
      if (!identifier.includes('@')) {
        const username = identifier.trim().toLowerCase();
        
        // Verificar se o username existe em pacientes_dependentes
        const { data: dependent, error: depError } = await supabase
          .from('pacientes_dependentes')
          .select('id')
          .eq('nome_usuario', username)
          .single();

        if (depError || !dependent) {
          toast({
            title: "Conta não encontrada",
            description: "Digite um e-mail válido ou nome de usuário.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Converter para email shadow (formato usado no cadastro de dependentes)
        emailToUse = `${username}@dep.sanare.local`;
      }

      // Enviar email de reset usando Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(emailToUse, {
        redirectTo: `${window.location.origin}/auth/forgot-password`
      });

      if (error) {
        toast({
          title: "Erro ao enviar código",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setEmail(emailToUse);
      setOtpSent(true);
      setStep('reset');
      
      toast({
        title: "Código enviado",
        description: "Enviamos um código para seu e-mail cadastrado. Verifique sua caixa de entrada."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar senhas
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast({
        title: "Senha inválida",
        description: passwordError,
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não conferem.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      setStep('success');
      
      toast({
        title: "Senha atualizada com sucesso",
        description: "Você será redirecionado para o login."
      });

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao redefinir sua senha.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/forgot-password`
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Código reenviado",
        description: "Um novo código foi enviado para seu e-mail."
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <button 
            onClick={() => navigate('/auth')}
            className="back-btn"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          {step === 'identify' && (
            <>
              <h1 className="text-mobile-2xl font-bold">Esqueceu sua senha?</h1>
              <p className="text-sm text-muted-foreground">
                Digite seu e-mail ou nome de usuário para recuperar o acesso
              </p>
            </>
          )}
          
          {step === 'reset' && (
            <>
              <h1 className="text-mobile-2xl font-bold">Definir nova senha</h1>
              <p className="text-sm text-muted-foreground">
                Crie uma senha forte e segura
              </p>
            </>
          )}
          
          {step === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-success" />
              </div>
              <h1 className="text-mobile-2xl font-bold">Senha atualizada!</h1>
              <p className="text-sm text-muted-foreground">
                Redirecionando para o login...
              </p>
            </>
          )}
        </div>

        {/* Etapa 1: Identificação */}
        {step === 'identify' && (
          <Card className="card-health">
            <form onSubmit={handleIdentify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier">E-mail ou usuário</Label>
                <Input
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="seu e-mail ou nome de usuário"
                  required
                  className="min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Dependentes: use seu nome de usuário
                </p>
              </div>

              <Button 
                type="submit" 
                className="btn-health w-full"
                disabled={loading || !identifier.trim()}
              >
                {loading ? 'Enviando...' : 'Continuar'}
              </Button>
            </form>
          </Card>
        )}

        {/* Etapa 2: Redefinir senha */}
        {step === 'reset' && (
          <Card className="card-health">
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    required
                    className="min-h-[44px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite novamente a senha"
                    required
                    className="min-h-[44px]"
                  />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>A senha deve conter:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Mínimo 8 caracteres</li>
                    <li>Pelo menos 1 letra</li>
                    <li>Pelo menos 1 número</li>
                  </ul>
                </div>
              </div>

              <Button 
                type="submit" 
                className="btn-health w-full"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>

              {otpSent && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                >
                  Reenviar código
                </Button>
              )}
            </form>
          </Card>
        )}

        {/* Sucesso */}
        {step === 'success' && (
          <Card className="card-health">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Sua senha foi atualizada com sucesso!
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="btn-health w-full"
              >
                Ir para login
              </Button>
            </div>
          </Card>
        )}

        {/* Link para voltar ao login */}
        {step !== 'success' && (
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/auth')}
              className="text-primary hover:text-primary-dark"
            >
              Voltar para o login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
