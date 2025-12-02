import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewType } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { MatchesService } from '../matches/matches.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchStatus } from '../matches/entities/match.entity';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private matchesService: MatchesService,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    matchId: string,
    reviewerId: string,
    createDto: CreateReviewDto,
  ): Promise<Review> {
    const match = await this.matchesService.findById(matchId);

    if (match.status !== MatchStatus.COMPLETED) {
      throw new BadRequestException('완료된 매칭만 리뷰를 작성할 수 있습니다');
    }

    const isRequester = match.requesterId === reviewerId;
    const isHelper = match.helperId === reviewerId;

    if (!isRequester && !isHelper) {
      throw new ForbiddenException('리뷰 작성 권한이 없습니다');
    }

    // Check if already reviewed
    const existingReview = await this.reviewRepository.findOne({
      where: { matchId, reviewerId },
    });

    if (existingReview) {
      throw new ConflictException('이미 리뷰를 작성했습니다');
    }

    const revieweeId = isRequester ? match.helperId : match.requesterId;
    const reviewType = isRequester ? ReviewType.TO_HELPER : ReviewType.TO_REQUESTER;

    const review = this.reviewRepository.create({
      matchId,
      reviewerId,
      revieweeId,
      reviewType,
      rating: createDto.rating,
      content: createDto.content,
      punctuality: createDto.punctuality,
      communication: createDto.communication,
      quality: createDto.quality,
      images: createDto.images,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update user rating
    await this.usersService.updateRating(
      revieweeId,
      reviewType === ReviewType.TO_HELPER ? 'helper' : 'requester',
      createDto.rating,
    );

    // Notify reviewee
    await this.notificationsService.create({
      userId: revieweeId,
      type: NotificationType.REVIEW_RECEIVED,
      title: '새로운 리뷰',
      body: `새로운 리뷰가 등록되었습니다`,
      referenceType: 'review',
      referenceId: savedReview.id,
    });

    return savedReview;
  }

  async findByUserId(userId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { revieweeId: userId, isVisible: true },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByMatchId(matchId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { matchId },
      relations: ['reviewer', 'reviewee'],
    });
  }

  async getAverageRating(userId: string, type: ReviewType): Promise<{
    average: number;
    count: number;
    breakdown: { punctuality: number; communication: number; quality: number };
  }> {
    const reviews = await this.reviewRepository.find({
      where: { revieweeId: userId, reviewType: type, isVisible: true },
    });

    if (reviews.length === 0) {
      return {
        average: 0,
        count: 0,
        breakdown: { punctuality: 0, communication: 0, quality: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const punctualitySum = reviews.reduce((acc, r) => acc + (r.punctuality || 0), 0);
    const communicationSum = reviews.reduce((acc, r) => acc + (r.communication || 0), 0);
    const qualitySum = reviews.reduce((acc, r) => acc + (r.quality || 0), 0);

    const reviewsWithDetails = reviews.filter((r) => r.punctuality);
    const detailCount = reviewsWithDetails.length || 1;

    return {
      average: Math.round((sum / reviews.length) * 10) / 10,
      count: reviews.length,
      breakdown: {
        punctuality: Math.round((punctualitySum / detailCount) * 10) / 10,
        communication: Math.round((communicationSum / detailCount) * 10) / 10,
        quality: Math.round((qualitySum / detailCount) * 10) / 10,
      },
    };
  }
}
