import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { MessageType } from './entities/message.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { RedisService } from '../config/redis.config';
import { LoggerService } from '../common/logger/logger.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string[]> = new Map();

  constructor(
    private chatsService: ChatsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private redisService: RedisService,
    private logger: LoggerService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      client.userId = payload.sub;

      // Store socket connection in memory and Redis
      const userSockets = this.userSockets.get(payload.sub) || [];
      userSockets.push(client.id);
      this.userSockets.set(payload.sub, userSockets);

      // Mark user as online in Redis
      await this.redisService.setUserOnline(payload.sub, true);

      this.logger.log(`Client connected: ${client.id}, User: ${payload.sub}`, 'ChatsGateway');
    } catch (error) {
      this.logger.warn(`Socket authentication failed: ${error.message}`, 'ChatsGateway');
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId) || [];
      const filtered = userSockets.filter((id) => id !== client.id);
      if (filtered.length > 0) {
        this.userSockets.set(client.userId, filtered);
      } else {
        this.userSockets.delete(client.userId);
        // Mark user as offline in Redis if no more connections
        await this.redisService.setUserOnline(client.userId, false);
      }
    }
    this.logger.debug(`Client disconnected: ${client.id}`, 'ChatsGateway');
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() roomId: string,
  ) {
    try {
      await this.chatsService.findRoomById(roomId, client.userId!);
      client.join(roomId);
      this.logger.debug(`User ${client.userId} joined room ${roomId}`, 'ChatsGateway');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      roomId: string;
      content: string;
      type?: MessageType;
      imageUrl?: string;
    },
  ) {
    try {
      const message = await this.chatsService.createMessage(
        data.roomId,
        client.userId!,
        data.content,
        data.type || MessageType.TEXT,
        data.imageUrl,
      );

      // Broadcast to room
      this.server.to(data.roomId).emit('newMessage', message);

      // Get room to find the other user
      const room = await this.chatsService.findRoomById(
        data.roomId,
        client.userId!,
      );
      const otherUserId =
        room.requesterId === client.userId ? room.helperId : room.requesterId;

      // Check if other user is online
      const isOtherUserOnline = this.isUserOnline(otherUserId);

      if (!isOtherUserOnline) {
        // Send push notification to offline user
        await this.sendChatPushNotification(
          otherUserId,
          client.userId!,
          data.roomId,
          data.content,
          room.job?.title,
        );
      }

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`, error.stack, 'ChatsGateway');
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() roomId: string,
  ) {
    try {
      await this.chatsService.markAsRead(roomId, client.userId!);

      // Notify sender that messages were read
      const room = await this.chatsService.findRoomById(roomId, client.userId!);
      const otherUserId =
        room.requesterId === client.userId ? room.helperId : room.requesterId;

      this.sendToUser(otherUserId, 'messagesRead', { roomId, readBy: client.userId });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ) {
    client.to(data.roomId).emit('userTyping', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('getOnlineStatus')
  async handleGetOnlineStatus(
    @MessageBody() userIds: string[],
  ): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
    for (const userId of userIds) {
      status[userId] = await this.isUserOnlineWithRedis(userId);
    }
    return status;
  }

  // Helper method to check if user is online (local check)
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Helper method to check if user is online (Redis check for multi-instance)
  async isUserOnlineWithRedis(userId: string): Promise<boolean> {
    if (this.userSockets.has(userId)) {
      return true;
    }
    return this.redisService.isUserOnline(userId);
  }

  // Helper method to send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  // Send push notification for new chat message
  private async sendChatPushNotification(
    recipientId: string,
    senderId: string,
    roomId: string,
    message: string,
    jobTitle?: string,
  ): Promise<void> {
    try {
      // Get sender info
      const senderName = await this.chatsService.getSenderName(senderId);

      // Truncate message if too long
      const truncatedMessage = message.length > 100
        ? message.substring(0, 100) + '...'
        : message;

      await this.notificationsService.create({
        userId: recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: senderName || '새 메시지',
        body: truncatedMessage,
        referenceType: 'chat',
        referenceId: roomId,
      });

      this.logger.debug(`Push notification sent to ${recipientId} for new message`, 'ChatsGateway');
    } catch (error) {
      this.logger.error(
        `Failed to send chat push notification: ${error.message}`,
        error.stack,
        'ChatsGateway',
      );
    }
  }

  // Broadcast to all connected clients (for system messages)
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Get count of online users
  getOnlineUserCount(): number {
    return this.userSockets.size;
  }
}
