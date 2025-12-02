import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
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
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Applications')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('jobs/:jobId/applications')
  @ApiOperation({ summary: '지원하기' })
  @ApiResponse({ status: 201, description: '지원 성공' })
  async create(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: User,
    @Body() createDto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(jobId, user.id, createDto);
  }

  @Get('jobs/:jobId/applications')
  @ApiOperation({ summary: '지원자 목록 조회 (의뢰자용)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findByJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.findByJobId(jobId, user.id);
  }

  @Get('applications/my')
  @ApiOperation({ summary: '내 지원 내역' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findMy(@CurrentUser() user: User) {
    return this.applicationsService.findByHelperId(user.id);
  }

  @Post('applications/:id/accept')
  @ApiOperation({ summary: '지원 수락' })
  @ApiResponse({ status: 200, description: '수락 성공' })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.accept(id, user.id);
  }

  @Post('applications/:id/reject')
  @ApiOperation({ summary: '지원 거절' })
  @ApiResponse({ status: 200, description: '거절 성공' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.applicationsService.reject(id, user.id);
  }

  @Delete('applications/:id')
  @ApiOperation({ summary: '지원 취소' })
  @ApiResponse({ status: 200, description: '취소 성공' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.applicationsService.cancel(id, user.id);
    return { message: '지원이 취소되었습니다' };
  }
}
