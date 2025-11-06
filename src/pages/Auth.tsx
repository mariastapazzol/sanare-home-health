import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import logoSanare from '@/assets/logo-sanare.png';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Convert username to shadow email if needed
    const email = identifier.includes('@') 
      ? identifier.trim() 
      : `${identifier.trim().toLowerCase()}@dep.sanare.local`;
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/home');
    }
    
    setLoading(false);
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
            <img 
              src={logoSanare} 
              alt="Sanare" 
              className="h-20 w-20"
            />
          </div>
          <h1 className="text-mobile-2xl font-bold">Entrar no Sanare</h1>
        </div>

        {/* Login Form */}
        <Card className="card-health">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">E-mail ou usuário</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="E-mail (cuidador/autônomo) ou usuário (dependente)"
                required
                className="min-h-[44px]"
              />
              <p className="text-xs text-muted-foreground">
                Dependentes: use seu nome de usuário
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
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

            <Button 
              type="submit" 
              className="btn-health w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        {/* Additional Options */}
        <div className="space-y-4 text-center">
          <Button 
            variant="ghost"
            onClick={() => navigate('/auth/forgot-password')}
            className="text-primary hover:text-primary-dark"
          >
            Esqueci minha senha
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Button 
              variant="link" 
              onClick={() => navigate('/auth/choice')}
              className="text-primary hover:text-primary-dark p-0 h-auto"
            >
              Criar conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;