import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Users } from 'lucide-react';
import logoSanare from '@/assets/logo-sanare.png';

const AuthChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
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
              className="w-40 h-auto"
            />
          </div>
          <p className="text-mobile-base text-muted-foreground">
            Como você pretende usar o Sanare?
          </p>
        </div>

        {/* Choice Cards */}
        <div className="space-y-4">
          <Card 
            className="card-health cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate('/auth/signup-autocuidado')}
          >
            <div className="flex items-center space-x-4 p-4">
              <div className="bg-primary/10 rounded-full p-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Para autocuidado</h3>
                <p className="text-sm text-muted-foreground">
                  Vou gerenciar minha própria saúde
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="card-health cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate('/auth/signup-cuidador')}
          >
            <div className="flex items-center space-x-4 p-4">
              <div className="bg-primary/10 rounded-full p-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Para cuidar de alguém</h3>
                <p className="text-sm text-muted-foreground">
                  Vou ajudar a gerenciar a saúde de outra pessoa
                </p>
              </div>
            </div>
          </Card>
        </div>

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

export default AuthChoice;
