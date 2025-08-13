import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, User, Users } from 'lucide-react';

const AuthSignup = () => {
  const navigate = useNavigate();

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
            Escolha o tipo de conta
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="space-y-4">
          <Card 
            className="card-health cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate('/auth/signup/personal')}
          >
            <div className="flex items-center space-x-4 p-4">
              <div className="bg-primary/10 rounded-full p-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-mobile-lg">Pra Mim</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciar meus próprios medicamentos
                </p>
              </div>
            </div>
          </Card>

          <Card 
            className="card-health cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => navigate('/auth/signup/caregiver')}
          >
            <div className="flex items-center space-x-4 p-4">
              <div className="bg-primary/10 rounded-full p-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-mobile-lg">Para Cuidar de Alguém</h3>
                <p className="text-sm text-muted-foreground">
                  Gerenciar medicamentos de outra pessoa
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

export default AuthSignup;