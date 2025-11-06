import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationSchedule {
  id: number;
  title: string;
  body: string;
  schedule: {
    at: Date;
    repeats?: boolean;
    every?: 'day' | 'week' | 'month' | 'year';
  };
}

const CHANNEL_ID = 'reminders';
const CHANNEL_NAME = 'Lembretes e Medicações';

// Check if we're running on a native platform
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};

// Initialize notification system
export const initializeNotifications = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('Not on native platform, skipping notification setup');
    return false;
  }

  try {
    // Create Android channel with max importance
    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME,
        description: 'Notificações de lembretes e medicações',
        importance: 5, // Max importance
        sound: 'default',
        vibration: true,
      });
    }

    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> => {
  if (!isNativePlatform()) {
    return 'denied';
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return 'denied';
  }
};

// Check current permission status
export const checkNotificationPermissions = async (): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> => {
  if (!isNativePlatform()) {
    return 'denied';
  }

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return 'denied';
  }
};

// Schedule a notification
export const scheduleNotification = async (notification: NotificationSchedule): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('Not on native platform, skipping notification schedule');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [{
        id: notification.id,
        title: notification.title,
        body: notification.body,
        schedule: notification.schedule,
        channelId: CHANNEL_ID,
        sound: 'default',
      }]
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

// Schedule multiple notifications at once
export const scheduleNotifications = async (notifications: NotificationSchedule[]): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('Not on native platform, skipping notifications schedule');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: n.schedule,
        channelId: CHANNEL_ID,
        sound: 'default',
      }))
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    throw error;
  }
};

// Cancel specific notifications by IDs
export const cancelNotifications = async (ids: number[]): Promise<void> => {
  if (!isNativePlatform()) {
    return;
  }

  if (ids.length === 0) return;

  try {
    await LocalNotifications.cancel({
      notifications: ids.map(id => ({ id }))
    });
  } catch (error) {
    console.error('Error canceling notifications:', error);
    throw error;
  }
};

// Get all pending notifications
export const getPendingNotifications = async (): Promise<any[]> => {
  if (!isNativePlatform()) {
    return [];
  }

  try {
    const result = await LocalNotifications.getPending();
    return result.notifications;
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
};

// Generate unique notification ID (timestamp-based)
export const generateNotificationId = (): number => {
  return Math.floor(Date.now() + Math.random() * 1000);
};

// Parse time string (HH:MM) and create Date for today at that time
export const parseTimeToDate = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (date < new Date()) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
};

// Schedule notifications for medication at specific times
export const scheduleMedicationNotifications = async (
  medicamentoId: string,
  nome: string,
  horarios: string[],
  existingIds: number[] = []
): Promise<number[]> => {
  if (!isNativePlatform()) {
    return [];
  }

  // Cancel existing notifications first
  if (existingIds.length > 0) {
    await cancelNotifications(existingIds);
  }

  const newIds: number[] = [];
  const notifications: NotificationSchedule[] = [];

  for (const horario of horarios) {
    const notificationId = generateNotificationId();
    newIds.push(notificationId);

    const scheduledDate = parseTimeToDate(horario);

    notifications.push({
      id: notificationId,
      title: '💊 Hora do Medicamento',
      body: `${nome} - ${horario}`,
      schedule: {
        at: scheduledDate,
        repeats: true,
        every: 'day',
      }
    });
  }

  await scheduleNotifications(notifications);
  return newIds;
};

// Schedule notifications for reminder at specific times and dates
export const scheduleReminderNotifications = async (
  lembreteId: string,
  nome: string,
  horarios: string[],
  datas: string[],
  existingIds: number[] = []
): Promise<number[]> => {
  if (!isNativePlatform()) {
    return [];
  }

  // Cancel existing notifications first
  if (existingIds.length > 0) {
    await cancelNotifications(existingIds);
  }

  const newIds: number[] = [];
  const notifications: NotificationSchedule[] = [];

  // If there are specific dates, schedule for those dates only
  if (datas && datas.length > 0) {
    for (const data of datas) {
      for (const horario of horarios) {
        const notificationId = generateNotificationId();
        newIds.push(notificationId);

        const [hours, minutes] = horario.split(':').map(Number);
        const scheduledDate = new Date(data);
        scheduledDate.setHours(hours, minutes, 0, 0);

        // Only schedule if in the future
        if (scheduledDate > new Date()) {
          notifications.push({
            id: notificationId,
            title: '🔔 Lembrete',
            body: `${nome} - ${horario}`,
            schedule: {
              at: scheduledDate,
              repeats: false,
            }
          });
        }
      }
    }
  } else {
    // No specific dates, schedule daily
    for (const horario of horarios) {
      const notificationId = generateNotificationId();
      newIds.push(notificationId);

      const scheduledDate = parseTimeToDate(horario);

      notifications.push({
        id: notificationId,
        title: '🔔 Lembrete',
        body: `${nome} - ${horario}`,
        schedule: {
          at: scheduledDate,
          repeats: true,
          every: 'day',
        }
      });
    }
  }

  if (notifications.length > 0) {
    await scheduleNotifications(notifications);
  }

  return newIds;
};
