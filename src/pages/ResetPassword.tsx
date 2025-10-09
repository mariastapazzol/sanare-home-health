import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [success, setSuccess] = useState(false);

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

  // Consumir a sessão de recuperação ao carregar a página
  useEffect(() => {
    const establishRecoverySession = async () => {
      try {
        // Verificar se há parâmetros de recovery na URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const code = queryParams.get('code');

        // Método 1: Link com access_token/refresh_token no hash
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Erro ao estabelecer sessão:', error);
            setSessionError(true);
            return;
          }

          setSessionReady(true);
          return;
        }

        // Método 2: Link com code (PKCE) no query string
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Erro ao trocar código por sessão:', error);
            setSessionError(true);
            return;
          }

          setSessionReady(true);
          return;
        }

        // Se não houver parâmetros, verificar se já existe uma sessão de recovery
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          setSessionError(true);
          return;
        }

        setSessionReady(true);
      } catch (error) {
        console.error('Erro ao estabelecer sessão de recovery:', error);
        setSessionError(true);
      }
    };

    establishRecoverySession();
  }, []);

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

      setSuccess(true);
      
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
      setLoading(false);
    }
  };

  // Loading enquanto estabelece a sessão
  if (!sessionReady && !sessionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Erro: link inválido ou expirado
  if (sessionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-destructive rounded-full p-4">
                <AlertCircle className="h-12 w-12 text-destructive-foreground" />
              </div>
            </div>
            
            <h1 className="text-mobile-2xl font-bold">Link inválido ou expirado</h1>
            <p className="text-sm text-muted-foreground">
              O link de redefinição não é válido ou já expirou. Solicite um novo link.
            </p>
          </div>

          <Card className="card-health">
            <div className="text-center">
              <Button 
                onClick={() => navigate('/auth/forgot-password')}
                className="btn-health w-full"
              >
                Solicitar novo link
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-success" />
            </div>
            <h1 className="text-mobile-2xl font-bold">Senha atualizada!</h1>
            <p className="text-sm text-muted-foreground">
              Redirecionando para o login...
            </p>
          </div>

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
        </div>
      </div>
    );
  }

  // Formulário de redefinição
  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-mobile-2xl font-bold">Definir nova senha</h1>
          <p className="text-sm text-muted-foreground">
            Crie uma senha forte e segura
          </p>
        </div>

        {/* Formulário */}
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
          </form>
        </Card>

        {/* Link para voltar */}
        <div className="text-center">
          <Button 
            variant="link" 
            onClick={() => navigate('/auth')}
            className="text-primary hover:text-primary-dark"
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
