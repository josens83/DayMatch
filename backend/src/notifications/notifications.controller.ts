import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: '알림 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(
    @CurrentUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.findByUserId(user.id, page, limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '읽지 않은 알림 수' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount: count };
  }

  @Post('read')
  @ApiOperation({ summary: '알림 읽음 처리' })
  @ApiResponse({ status: 200, description: '처리 성공' })
  async markAsRead(
    @CurrentUser() user: User,
    @Body() body: { notificationIds?: string[]; all?: boolean },
  ) {
    if (body.all) {
      await this.notificationsService.markAllAsRead(user.id);
    } else if (body.notificationIds && body.notificationIds.length > 0) {
      await this.notificationsService.markAsRead(body.notificationIds, user.id);
    }
    return { message: '읽음 처리되었습니다' };
  }
}
