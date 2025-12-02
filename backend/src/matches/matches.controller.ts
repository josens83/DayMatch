import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('my')
  @ApiOperation({ summary: '내 매칭 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findMy(@CurrentUser() user: User) {
    return this.matchesService.findByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '매칭 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.matchesService.findById(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '작업 시작 (헬퍼)' })
  @ApiResponse({ status: 200, description: '시작 성공' })
  async start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.start(id, user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '작업 완료 (헬퍼)' })
  @ApiResponse({ status: 200, description: '완료 요청 성공' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.complete(id, user.id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '완료 확인 (의뢰자)' })
  @ApiResponse({ status: 200, description: '확인 성공' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.confirm(id, user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '매칭 취소' })
  @ApiResponse({ status: 200, description: '취소 성공' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.matchesService.cancel(id, user.id);
  }
}
