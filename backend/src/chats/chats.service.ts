import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Message, MessageType } from './entities/message.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getSenderName(senderId: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: senderId },
      select: ['name'],
    });
    return user?.name || '알 수 없는 사용자';
  }

  async createRoom(
    jobId: string,
    matchId: string,
    requesterId: string,
    helperId: string,
  ): Promise<ChatRoom> {
    // Check if room already exists
    const existingRoom = await this.chatRoomRepository.findOne({
      where: { jobId, requesterId, helperId },
    });

    if (existingRoom) {
      return existingRoom;
    }

    const room = this.chatRoomRepository.create({
      jobId,
      matchId,
      requesterId,
      helperId,
    });

    return this.chatRoomRepository.save(room);
  }

  async findRoomsByUserId(userId: string): Promise<ChatRoom[]> {
    return this.chatRoomRepository.find({
      where: [{ requesterId: userId }, { helperId: userId }],
      relations: ['job', 'requester', 'helper'],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async findRoomById(id: string, userId: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne({
      where: { id },
      relations: ['job', 'requester', 'helper'],
    });

    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다');
    }

    if (room.requesterId !== userId && room.helperId !== userId) {
      throw new ForbiddenException('채팅방에 접근할 권한이 없습니다');
    }

    return room;
  }

  async getMessages(
    roomId: string,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    await this.findRoomById(roomId, userId);

    const skip = (page - 1) * limit;
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { roomId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      messages: messages.reverse(),
      hasMore: skip + messages.length < total,
    };
  }

  async createMessage(
    roomId: string,
    senderId: string,
    content: string,
    type: MessageType = MessageType.TEXT,
    imageUrl?: string,
  ): Promise<Message> {
    const room = await this.findRoomById(roomId, senderId);

    const message = this.messageRepository.create({
      roomId,
      senderId,
      content,
      messageType: type,
      imageUrl,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update room's last message
    room.lastMessage = content;
    room.lastMessageAt = new Date();
    await this.chatRoomRepository.save(room);

    return savedMessage;
  }

  async markAsRead(roomId: string, userId: string): Promise<void> {
    await this.findRoomById(roomId, userId);

    await this.messageRepository.update(
      { roomId, isRead: false, senderId: userId },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const rooms = await this.chatRoomRepository.find({
      where: [{ requesterId: userId }, { helperId: userId }],
      select: ['id'],
    });

    if (rooms.length === 0) return 0;

    const roomIds = rooms.map((r) => r.id);
    const count = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.roomId IN (:...roomIds)', { roomIds })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = false')
      .getCount();

    return count;
  }
}
