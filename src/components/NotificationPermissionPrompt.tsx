import { useEffect, useState } from 'react';
import { Bell, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';

const PERMISSION_PROMPTED_KEY = 'notification-permission-prompted';

export const NotificationPermissionPrompt = () => {
  const { permissionStatus, requestPermissions, isNativePlatform } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show on native platforms
    if (!isNativePlatform) return;

    // Check if we've already prompted
    const hasPrompted = localStorage.getItem(PERMISSION_PROMPTED_KEY);
    
    // Show prompt if permission is still prompt/prompt-with-rationale and we haven't prompted yet
    if ((permissionStatus === 'prompt' || permissionStatus === 'prompt-with-rationale') && !hasPrompted) {
      setShowPrompt(true);
    }
  }, [permissionStatus, isNativePlatform]);

  const handleRequest = async () => {
    const granted = await requestPermissions();
    localStorage.setItem(PERMISSION_PROMPTED_KEY, 'true');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(PERMISSION_PROMPTED_KEY, 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Bell className="h-12 w-12 text-primary" />
          </div>

          <h2 className="text-xl font-bold">Ativar Notificações</h2>
          
          <p className="text-muted-foreground">
            Receba lembretes no horário certo para seus medicamentos e compromissos.
          </p>

          <div className="w-full space-y-2">
            <Button onClick={handleRequest} className="w-full btn-health">
              <Bell className="mr-2 h-4 w-4" />
              Ativar Notificações
            </Button>
            
            <Button onClick={handleDismiss} variant="ghost" className="w-full">
              Mais tarde
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const NotificationPermissionDeniedAlert = () => {
  const { permissionStatus, isNativePlatform } = useNotifications();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!isNativePlatform) return;
    
    const hasPrompted = localStorage.getItem(PERMISSION_PROMPTED_KEY);
    
    if (permissionStatus === 'denied' && hasPrompted) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [permissionStatus, isNativePlatform]);

  if (!showAlert) return null;

  return (
    <Card className="border-warning bg-warning/10 p-4 mb-4">
      <div className="flex items-start gap-3">
        <Settings className="h-5 w-5 text-warning mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">Notificações desativadas</p>
          <p className="text-xs text-muted-foreground">
            Para receber lembretes, ative as notificações nas Configurações do seu dispositivo.
          </p>
        </div>
        <button onClick={() => setShowAlert(false)}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </Card>
  );
};
