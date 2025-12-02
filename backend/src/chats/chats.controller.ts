import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  @ApiOperation({ summary: '채팅방 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(@CurrentUser() user: User) {
    return this.chatsService.findRoomsByUserId(user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: '읽지 않은 메시지 수' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.chatsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '메시지 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getMessages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatsService.getMessages(id, user.id, page, limit);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: '메시지 전송' })
  @ApiResponse({ status: 201, description: '전송 성공' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { content: string },
  ) {
    return this.chatsService.createMessage(id, user.id, body.content);
  }

  @Post(':id/read')
  @ApiOperation({ summary: '읽음 처리' })
  @ApiResponse({ status: 200, description: '처리 성공' })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.chatsService.markAsRead(id, user.id);
    return { message: '읽음 처리되었습니다' };
  }
}
