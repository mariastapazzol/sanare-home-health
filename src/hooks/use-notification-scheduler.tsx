import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCareContext } from '@/hooks/use-care-context';
import { supabase } from '@/integrations/supabase/client';
import {
  scheduleMedicationNotifications,
  scheduleReminderNotifications,
  isNativePlatform,
} from '@/lib/notifications';
import { useNotifications } from './use-notifications';

/**
 * Hook to reschedule all notifications on app start
 * This ensures notifications are always in sync with the database
 */
export const useNotificationScheduler = () => {
  const { user } = useAuth();
  const { currentContext, isContextReady } = useCareContext();
  const { permissionStatus, isInitialized } = useNotifications();

  useEffect(() => {
    // Only run if we have permissions and are on native platform
    if (!isNativePlatform() || !isInitialized || permissionStatus !== 'granted') {
      return;
    }

    if (!user || !isContextReady || !currentContext?.id) {
      return;
    }

    const rescheduleAll = async () => {
      console.log('Rescheduling all notifications...');

      try {
        // Reschedule medications
        const { data: medicamentos } = await supabase
          .from('medicamentos')
          .select('id, nome, horarios, notification_ids')
          .eq('context_id', currentContext.id);

        if (medicamentos) {
          for (const med of medicamentos) {
            const horarios = (med.horarios as any[]) || [];
            const existingIds = (med.notification_ids as number[]) || [];

            if (horarios.length > 0) {
              const newIds = await scheduleMedicationNotifications(
                med.id,
                med.nome,
                horarios,
                existingIds
              );

              // Update notification_ids in database
              await supabase
                .from('medicamentos')
                .update({ notification_ids: newIds })
                .eq('id', med.id);
            }
          }
        }

        // Reschedule reminders
        const { data: lembretes } = await supabase
          .from('lembretes')
          .select('id, nome, horarios, datas, notification_ids')
          .eq('context_id', currentContext.id);

        if (lembretes) {
          for (const lembrete of lembretes) {
            const horarios = (lembrete.horarios as any[]) || [];
            const datas = (lembrete.datas as string[]) || [];
            const existingIds = (lembrete.notification_ids as number[]) || [];

            if (horarios.length > 0) {
              const newIds = await scheduleReminderNotifications(
                lembrete.id,
                lembrete.nome,
                horarios,
                datas,
                existingIds
              );

              // Update notification_ids in database
              await supabase
                .from('lembretes')
                .update({ notification_ids: newIds })
                .eq('id', lembrete.id);
            }
          }
        }

        console.log('All notifications rescheduled successfully');
      } catch (error) {
        console.error('Error rescheduling notifications:', error);
      }
    };

    rescheduleAll();
  }, [user, currentContext, isContextReady, permissionStatus, isInitialized]);
};
