import {
  Controller,
  Get,
  Post,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Reviews')
@Controller()
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('matches/:matchId/reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: '리뷰 작성' })
  @ApiResponse({ status: 201, description: '리뷰 작성 완료' })
  async create(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser() user: User,
    @Body() createDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(matchId, user.id, createDto);
  }

  @Get('reviews/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '내가 받은 리뷰' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findMy(@CurrentUser() user: User) {
    return this.reviewsService.findByUserId(user.id);
  }

  @Get('users/:id/reviews')
  @Public()
  @ApiOperation({ summary: '사용자 리뷰 목록' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findByUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findByUserId(id);
  }
}
