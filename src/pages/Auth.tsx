import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import { Label } from '@/components/ui/label';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
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
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-2xl font-bold">Entrar no Sanare</h1>
        </div>

        {/* Login Form */}
        <Card className="card-health">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail ou Nome de usuário</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com ou usuario123"
                required
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="min-h-[44px]"
              />
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
              onClick={() => navigate('/auth/signup')}
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