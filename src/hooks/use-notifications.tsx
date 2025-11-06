import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  initializeNotifications,
  requestNotificationPermissions,
  checkNotificationPermissions,
  isNativePlatform,
} from '@/lib/notifications';

export const useNotifications = () => {
  const { toast } = useToast();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'>('prompt');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isNativePlatform()) {
        setIsInitialized(false);
        return;
      }

      const initialized = await initializeNotifications();
      setIsInitialized(initialized);

      if (initialized) {
        const status = await checkNotificationPermissions();
        setPermissionStatus(status);
      }
    };

    init();
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    if (!isNativePlatform()) {
      toast({
        title: 'Notificações não disponíveis',
        description: 'As notificações só funcionam no aplicativo mobile.',
        variant: 'destructive',
      });
      return false;
    }

    const status = await requestNotificationPermissions();
    setPermissionStatus(status);

    if (status === 'granted') {
      toast({
        title: 'Notificações ativadas',
        description: 'Você receberá lembretes dos seus medicamentos e compromissos.',
      });
      return true;
    } else if (status === 'denied') {
      toast({
        title: 'Permissão negada',
        description: 'Para receber notificações, ative nas Configurações do seu dispositivo.',
        variant: 'destructive',
      });
      return false;
    }

    return false;
  };

  const checkPermissions = async (): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> => {
    if (!isNativePlatform()) {
      return 'denied';
    }

    const status = await checkNotificationPermissions();
    setPermissionStatus(status);
    return status;
  };

  return {
    permissionStatus,
    isInitialized,
    requestPermissions,
    checkPermissions,
    isNativePlatform: isNativePlatform(),
  };
};
