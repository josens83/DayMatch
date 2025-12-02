import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    const saved = await this.notificationRepository.save(notification);

    // TODO: Send push notification
    // await this.sendPushNotification(saved);

    return saved;
  }

  async findByUserId(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const skip = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      this.notificationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      }),
      this.notificationRepository.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: In(notificationIds), userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // private async sendPushNotification(notification: Notification): Promise<void> {
  //   // Implementation for FCM/APNs push notification
  // }
}
