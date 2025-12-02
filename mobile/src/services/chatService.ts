import { io, Socket } from 'socket.io-client';
import api, { getTokens } from './api';
import { ChatRoom, Message, ApiResponse } from '../types';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const chatService = {
  // REST API methods
  async getRooms(): Promise<ChatRoom[]> {
    const response = await api.get<ApiResponse<ChatRoom[]>>('/chats');
    return response.data.data;
  },

  async getMessages(
    roomId: string,
    page = 1,
    limit = 50
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const response = await api.get<
      ApiResponse<{ messages: Message[]; hasMore: boolean }>
    >(`/chats/${roomId}/messages`, { params: { page, limit } });
    return response.data.data;
  },

  async sendMessage(roomId: string, content: string): Promise<Message> {
    const response = await api.post<ApiResponse<Message>>(
      `/chats/${roomId}/messages`,
      { content }
    );
    return response.data.data;
  },

  async markAsRead(roomId: string): Promise<void> {
    await api.post(`/chats/${roomId}/read`);
  },

  async getUnreadCount(): Promise<number> {
    const response = await api.get<ApiResponse<{ unreadCount: number }>>(
      '/chats/unread'
    );
    return response.data.data.unreadCount;
  },

  // Socket.io methods
  async connect(): Promise<Socket> {
    if (socket?.connected) return socket;

    const { accessToken } = await getTokens();

    socket = io(`${SOCKET_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    return new Promise((resolve, reject) => {
      socket!.on('connect', () => {
        console.log('Socket connected');
        resolve(socket!);
      });

      socket!.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinRoom(roomId: string): void {
    socket?.emit('joinRoom', roomId);
  },

  leaveRoom(roomId: string): void {
    socket?.emit('leaveRoom', roomId);
  },

  sendSocketMessage(
    roomId: string,
    content: string,
    type: 'text' | 'image' = 'text',
    imageUrl?: string
  ): void {
    socket?.emit('sendMessage', { roomId, content, type, imageUrl });
  },

  markAsReadSocket(roomId: string): void {
    socket?.emit('markAsRead', roomId);
  },

  sendTyping(roomId: string, isTyping: boolean): void {
    socket?.emit('typing', { roomId, isTyping });
  },

  onNewMessage(callback: (message: Message) => void): void {
    socket?.on('newMessage', callback);
  },

  onUserTyping(
    callback: (data: { userId: string; isTyping: boolean }) => void
  ): void {
    socket?.on('userTyping', callback);
  },

  offNewMessage(): void {
    socket?.off('newMessage');
  },

  offUserTyping(): void {
    socket?.off('userTyping');
  },
};

export default chatService;
