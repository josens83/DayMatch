import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsDto } from './dto/search-jobs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '일 등록' })
  @ApiResponse({ status: 201, description: '등록 성공' })
  async create(
    @CurrentUser() user: User,
    @Body() createJobDto: CreateJobDto,
  ) {
    return this.jobsService.create(user.id, createJobDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '일 목록/검색' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findAll(@Query() searchJobsDto: SearchJobsDto) {
    return this.jobsService.findAll(searchJobsDto);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 등록한 일 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findMyJobs(@CurrentUser() user: User) {
    return this.jobsService.findByRequesterId(user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '일 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 404, description: '일 없음' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '일 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.id, updateJobDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '일 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.jobsService.delete(id, user.id);
    return { message: '삭제되었습니다' };
  }
}
