import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const PUSH_TOKEN_KEY = '@daymatch_push_token';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  type: 'expo' | 'fcm' | 'apns';
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize push notifications
   * Call this when the app starts after user is authenticated
   */
  async initialize(): Promise<string | null> {
    try {
      // Check if we're on a physical device
      if (!Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual EAS project ID
      });

      this.expoPushToken = tokenData.data;

      // Save token locally
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.expoPushToken);

      // Register token with backend
      await this.registerTokenWithBackend(this.expoPushToken);

      console.log('Push notification initialized:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return null;
    }
  }

  /**
   * Setup Android notification channel
   */
  private async setupAndroidChannel(): Promise<void> {
    // Default channel for general notifications
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
    });

    // Channel for chat messages
    await Notifications.setNotificationChannelAsync('chat', {
      name: '채팅 알림',
      description: '새 메시지 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 100, 100],
      lightColor: '#4F46E5',
      sound: 'default',
    });

    // Channel for job updates
    await Notifications.setNotificationChannelAsync('jobs', {
      name: '일자리 알림',
      description: '일자리 관련 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
    });

    // Channel for match updates
    await Notifications.setNotificationChannelAsync('matches', {
      name: '매칭 알림',
      description: '매칭 관련 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      sound: 'default',
    });

    // Channel for payment updates
    await Notifications.setNotificationChannelAsync('payments', {
      name: '결제 알림',
      description: '결제 관련 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      lightColor: '#10B981',
      sound: 'default',
    });
  }

  /**
   * Register push token with backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await api.post('/users/push-token', {
        token,
        platform: Platform.OS,
        deviceType: Device.deviceType,
        deviceName: Device.deviceName,
      });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
      // Don't throw - token registration failure shouldn't block the app
    }
  }

  /**
   * Setup notification listeners
   * Returns cleanup function
   */
  setupListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationResponse?: (response: Notifications.NotificationResponse) => void,
  ): () => void {
    // Listener for when notification is received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        onNotificationReceived?.(notification);
      },
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        onNotificationResponse?.(response);
      },
    );

    // Return cleanup function
    return () => {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }
    };
  }

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  handleNotificationNavigation(
    response: Notifications.NotificationResponse,
    navigate: (screen: string, params?: any) => void,
  ): void {
    const data = response.notification.request.content.data;

    if (!data) return;

    const { type, referenceType, referenceId } = data as {
      type?: string;
      referenceType?: string;
      referenceId?: string;
    };

    switch (referenceType) {
      case 'chat':
        if (referenceId) {
          navigate('ChatRoom', { roomId: referenceId });
        } else {
          navigate('ChatList');
        }
        break;

      case 'job':
        if (referenceId) {
          navigate('JobDetail', { jobId: referenceId });
        } else {
          navigate('Home');
        }
        break;

      case 'application':
        if (referenceId) {
          navigate('ApplicationDetail', { applicationId: referenceId });
        } else {
          navigate('MyJobs');
        }
        break;

      case 'match':
        if (referenceId) {
          navigate('MatchDetail', { matchId: referenceId });
        } else {
          navigate('MyMatches');
        }
        break;

      case 'payment':
        if (referenceId) {
          navigate('PaymentDetail', { paymentId: referenceId });
        } else {
          navigate('Payments');
        }
        break;

      case 'review':
        if (referenceId) {
          navigate('ReviewDetail', { reviewId: referenceId });
        } else {
          navigate('MyReviews');
        }
        break;

      default:
        // Navigate to notifications list
        navigate('Notifications');
        break;
    }
  }

  /**
   * Get stored push token
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput,
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: trigger || null, // null means immediate
    });
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Unregister push token (call on logout)
   */
  async unregister(): Promise<void> {
    try {
      const token = await this.getStoredToken();
      if (token) {
        // Notify backend to remove token
        await api.delete('/users/push-token', {
          data: { token },
        });
      }

      // Clear local storage
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      this.expoPushToken = null;

      console.log('Push notification unregistered');
    } catch (error) {
      console.error('Failed to unregister push token:', error);
    }
  }

  /**
   * Check if push notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }
}

export const notificationService = new NotificationService();
export default notificationService;
