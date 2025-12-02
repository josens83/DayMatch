import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { HelperProfileDto } from './dto/helper-profile.dto';
import {
  RegisterPushTokenDto,
  UnregisterPushTokenDto,
  SetPushEnabledDto,
} from './dto/push-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 정보 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, updateUserDto);
  }

  @Post('me/helper-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: '헬퍼 프로필 활성화' })
  @ApiResponse({ status: 201, description: '헬퍼 프로필 활성화 성공' })
  async activateHelperProfile(
    @CurrentUser() user: User,
    @Body() helperProfileDto: HelperProfileDto,
  ) {
    return this.usersService.activateHelperProfile(user.id, helperProfileDto);
  }

  @Post('push-token')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '푸시 토큰 등록' })
  @ApiResponse({ status: 200, description: '등록 성공' })
  async registerPushToken(
    @CurrentUser() user: User,
    @Body() dto: RegisterPushTokenDto,
  ) {
    await this.usersService.registerPushToken(user.id, dto.token, dto.platform);
    return { success: true, message: '푸시 토큰이 등록되었습니다' };
  }

  @Delete('push-token')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '푸시 토큰 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async unregisterPushToken(
    @CurrentUser() user: User,
    @Body() dto: UnregisterPushTokenDto,
  ) {
    await this.usersService.unregisterPushToken(user.id, dto.token);
    return { success: true, message: '푸시 토큰이 삭제되었습니다' };
  }

  @Patch('push-settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: '푸시 알림 설정 변경' })
  @ApiResponse({ status: 200, description: '설정 변경 성공' })
  async setPushEnabled(
    @CurrentUser() user: User,
    @Body() dto: SetPushEnabledDto,
  ) {
    await this.usersService.setPushEnabled(user.id, dto.enabled);
    return { success: true, enabled: dto.enabled };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '사용자 프로필 조회 (공개)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
