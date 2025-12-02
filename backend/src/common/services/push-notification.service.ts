import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { LoggerService } from '../logger/logger.service';

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  onModuleInit() {
    const projectId = this.configService.get('firebase.projectId');
    const privateKey = this.configService.get('firebase.privateKey');
    const clientEmail = this.configService.get('firebase.clientEmail');

    if (projectId && privateKey && clientEmail) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.isInitialized = true;
        this.logger.log('Firebase Admin SDK initialized', 'PushNotificationService');
      } catch (error) {
        this.logger.error('Firebase initialization failed', error.stack, 'PushNotificationService');
      }
    } else {
      this.logger.warn('Firebase credentials not configured', 'PushNotificationService');
    }
  }

  async sendToDevice(deviceToken: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.debug(`[DEV PUSH] Token: ${deviceToken.slice(0, 20)}..., Title: ${payload.title}`, 'PushNotificationService');
      return true;
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      this.logger.log(`Push sent to device: ${deviceToken.slice(0, 20)}...`, 'PushNotificationService');
      return true;
    } catch (error) {
      this.logger.error(`Push failed: ${error.message}`, error.stack, 'PushNotificationService');
      return false;
    }
  }

  async sendToMultipleDevices(deviceTokens: string[], payload: PushNotificationPayload): Promise<{ successCount: number; failureCount: number }> {
    if (!this.isInitialized) {
      this.logger.debug(`[DEV PUSH] To ${deviceTokens.length} devices, Title: ${payload.title}`, 'PushNotificationService');
      return { successCount: deviceTokens.length, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: deviceTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`Push sent: ${response.successCount} success, ${response.failureCount} failed`, 'PushNotificationService');
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`Multicast push failed: ${error.message}`, error.stack, 'PushNotificationService');
      return { successCount: 0, failureCount: deviceTokens.length };
    }
  }

  async sendToTopic(topic: string, payload: PushNotificationPayload): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.debug(`[DEV PUSH] Topic: ${topic}, Title: ${payload.title}`, 'PushNotificationService');
      return true;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data,
      };

      await admin.messaging().send(message);
      this.logger.log(`Push sent to topic: ${topic}`, 'PushNotificationService');
      return true;
    } catch (error) {
      this.logger.error(`Topic push failed: ${error.message}`, error.stack, 'PushNotificationService');
      return false;
    }
  }

  async subscribeToTopic(deviceToken: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return true;

    try {
      await admin.messaging().subscribeToTopic([deviceToken], topic);
      return true;
    } catch (error) {
      this.logger.error(`Topic subscription failed: ${error.message}`, error.stack, 'PushNotificationService');
      return false;
    }
  }

  async unsubscribeFromTopic(deviceToken: string, topic: string): Promise<boolean> {
    if (!this.isInitialized) return true;

    try {
      await admin.messaging().unsubscribeFromTopic([deviceToken], topic);
      return true;
    } catch (error) {
      this.logger.error(`Topic unsubscription failed: ${error.message}`, error.stack, 'PushNotificationService');
      return false;
    }
  }
}
