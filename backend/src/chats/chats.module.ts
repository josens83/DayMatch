import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, Message, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatsController],
  providers: [ChatsService, ChatsGateway],
  exports: [ChatsService],
})
export class ChatsModule {}
