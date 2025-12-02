import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    jobId: string,
    applicationId: string,
    helperId: string,
    requesterId: string,
    finalPay: number,
  ): Promise<Match> {
    const match = this.matchRepository.create({
      jobId,
      applicationId,
      helperId,
      requesterId,
      finalPay,
      status: MatchStatus.CONFIRMED,
    });

    return this.matchRepository.save(match);
  }

  async findById(id: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id },
      relations: ['job', 'helper', 'requester'],
    });

    if (!match) {
      throw new NotFoundException('매칭을 찾을 수 없습니다');
    }

    return match;
  }

  async findByUserId(userId: string): Promise<Match[]> {
    return this.matchRepository.find({
      where: [{ helperId: userId }, { requesterId: userId }],
      relations: ['job', 'helper', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async start(id: string, helperId: string): Promise<Match> {
    const match = await this.findById(id);

    if (match.helperId !== helperId) {
      throw new ForbiddenException('작업 시작 권한이 없습니다');
    }

    if (match.status !== MatchStatus.CONFIRMED) {
      throw new BadRequestException('확정된 매칭만 시작할 수 있습니다');
    }

    match.status = MatchStatus.IN_PROGRESS;
    match.helperStartedAt = new Date();
    await this.matchRepository.save(match);

    // Notify requester
    await this.notificationsService.create({
      userId: match.requesterId,
      type: NotificationType.WORK_STARTED,
      title: '작업 시작',
      body: `${match.job.title} 작업이 시작되었습니다`,
      referenceType: 'match',
      referenceId: match.id,
    });

    return match;
  }

  async complete(id: string, helperId: string): Promise<Match> {
    const match = await this.findById(id);

    if (match.helperId !== helperId) {
      throw new ForbiddenException('작업 완료 권한이 없습니다');
    }

    if (match.status !== MatchStatus.IN_PROGRESS) {
      throw new BadRequestException('진행 중인 작업만 완료할 수 있습니다');
    }

    match.helperCompletedAt = new Date();
    await this.matchRepository.save(match);

    // Notify requester
    await this.notificationsService.create({
      userId: match.requesterId,
      type: NotificationType.WORK_COMPLETED,
      title: '작업 완료 확인 요청',
      body: `${match.job.title} 작업 완료를 확인해주세요`,
      referenceType: 'match',
      referenceId: match.id,
    });

    return match;
  }

  async confirm(id: string, requesterId: string): Promise<Match> {
    const match = await this.findById(id);

    if (match.requesterId !== requesterId) {
      throw new ForbiddenException('확인 권한이 없습니다');
    }

    if (!match.helperCompletedAt) {
      throw new BadRequestException('헬퍼가 작업 완료를 먼저 요청해야 합니다');
    }

    match.status = MatchStatus.COMPLETED;
    match.requesterConfirmedAt = new Date();
    match.completedAt = new Date();
    await this.matchRepository.save(match);

    // TODO: Trigger payment release

    return match;
  }

  async cancel(id: string, userId: string): Promise<Match> {
    const match = await this.findById(id);

    if (match.helperId !== userId && match.requesterId !== userId) {
      throw new ForbiddenException('취소 권한이 없습니다');
    }

    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('완료된 매칭은 취소할 수 없습니다');
    }

    // Check cancellation policy (24 hours before work date)
    const workDate = new Date(match.job.workDate);
    const now = new Date();
    const hoursUntilWork =
      (workDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilWork < 24 && match.status === MatchStatus.IN_PROGRESS) {
      throw new BadRequestException(
        '작업 시작 24시간 전부터는 취소할 수 없습니다',
      );
    }

    match.status = MatchStatus.CANCELLED;
    await this.matchRepository.save(match);

    // Notify the other party
    const notifyUserId =
      userId === match.helperId ? match.requesterId : match.helperId;
    await this.notificationsService.create({
      userId: notifyUserId,
      type: NotificationType.SYSTEM,
      title: '매칭 취소',
      body: `${match.job.title} 매칭이 취소되었습니다`,
      referenceType: 'match',
      referenceId: match.id,
    });

    return match;
  }
}
