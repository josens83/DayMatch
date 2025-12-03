import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from '../users/entities/user.entity';
import { PushNotificationService } from '../common/services/push-notification.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private pushService: PushNotificationService,
    private logger: LoggerService,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    const saved = await this.notificationRepository.save(notification);

    // Send push notification asynchronously
    this.sendPushNotification(saved).catch((error) => {
      this.logger.error(`Push notification failed: ${error.message}`, error.stack, 'NotificationsService');
    });

    this.logger.log(`Notification created: ${saved.id} for user: ${saved.userId}`, 'NotificationsService');
    return saved;
  }

  async createBulk(
    userIds: string[],
    notificationData: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<void> {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        ...notificationData,
        userId,
      }),
    );

    await this.notificationRepository.save(notifications);

    // Send push notifications to all users
    this.sendBulkPushNotification(userIds, notificationData).catch((error) => {
      this.logger.error(`Bulk push notification failed: ${error.message}`, error.stack, 'NotificationsService');
    });

    this.logger.log(`Bulk notifications created for ${userIds.length} users`, 'NotificationsService');
  }

  async findByUserId(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; unreadCount: number; total: number }> {
    const skip = (page - 1) * limit;

    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount, total };
  }

  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: In(notificationIds), userId },
      { isRead: true },
    );
    this.logger.log(`Marked ${notificationIds.length} notifications as read for user: ${userId}`, 'NotificationsService');
  }

  async markAllAsRead(userId: string): Promise<void> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    this.logger.log(`Marked ${result.affected} notifications as read for user: ${userId}`, 'NotificationsService');
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Deleted ${result.affected} old notifications`, 'NotificationsService');
    return result.affected || 0;
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: notification.userId },
      select: ['id', 'deviceToken', 'pushEnabled'],
    });

    if (!user || !user.deviceToken || !user.pushEnabled) {
      return;
    }

    await this.pushService.sendToDevice(user.deviceToken, {
      title: notification.title,
      body: notification.body || '',
      data: {
        notificationId: notification.id,
        type: notification.type,
        referenceType: notification.referenceType || '',
        referenceId: notification.referenceId || '',
      },
    });
  }

  private async sendBulkPushNotification(
    userIds: string[],
    notificationData: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<void> {
    const users = await this.userRepository.find({
      where: { id: In(userIds), pushEnabled: true },
      select: ['id', 'deviceToken'],
    });

    const deviceTokens = users
      .filter((user): user is User & { deviceToken: string } => !!user.deviceToken)
      .map((user) => user.deviceToken);

    if (deviceTokens.length === 0) {
      return;
    }

    const result = await this.pushService.sendToMultipleDevices(deviceTokens, {
      title: notificationData.title,
      body: notificationData.body || '',
      data: {
        type: notificationData.type,
        referenceType: notificationData.referenceType || '',
        referenceId: notificationData.referenceId || '',
      },
    });

    this.logger.log(
      `Push sent to ${result.successCount}/${deviceTokens.length} devices`,
      'NotificationsService',
    );
  }

  // Topic-based notifications for broadcasts
  async sendToTopic(topic: string, title: string, body: string): Promise<void> {
    await this.pushService.sendToTopic(topic, { title, body });
    this.logger.log(`Push sent to topic: ${topic}`, 'NotificationsService');
  }

  async subscribeUserToTopic(userId: string, topic: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['deviceToken'],
    });

    if (user?.deviceToken) {
      await this.pushService.subscribeToTopic(user.deviceToken, topic);
    }
  }

  async unsubscribeUserFromTopic(userId: string, topic: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['deviceToken'],
    });

    if (user?.deviceToken) {
      await this.pushService.unsubscribeFromTopic(user.deviceToken, topic);
    }
  }
}
