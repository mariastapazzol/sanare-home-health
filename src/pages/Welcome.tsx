import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heart, Pill, Shield } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-health-light to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <Heart className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-mobile-3xl font-bold text-foreground">Sanare</h1>
          <p className="text-mobile-base text-muted-foreground">
            Organize seus medicamentos e cuide da sua saúde
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <Card className="card-health">
            <div className="flex items-center space-x-4 p-2">
              <div className="bg-primary/10 rounded-full p-3">
                <Pill className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Controle de Medicamentos</h3>
                <p className="text-sm text-muted-foreground">Gerencie dosagens e horários</p>
              </div>
            </div>
          </Card>

          <Card className="card-health">
            <div className="flex items-center space-x-4 p-2">
              <div className="bg-primary/10 rounded-full p-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Estoque Inteligente</h3>
                <p className="text-sm text-muted-foreground">Alertas de medicamentos acabando</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={() => navigate('/auth')}
            className="btn-health w-full"
          >
            Entrar
          </Button>
          
          <Button 
            onClick={() => navigate('/auth/choice')}
            variant="outline"
            className="btn-health-outline w-full"
          >
            Criar Conta
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Sua saúde em boas mãos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;