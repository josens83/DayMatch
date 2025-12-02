import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JobsService } from '../jobs/jobs.service';
import { MatchesService } from '../matches/matches.service';
import { ChatsService } from '../chats/chats.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JobStatus } from '../jobs/entities/job.entity';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    private jobsService: JobsService,
    private matchesService: MatchesService,
    private chatsService: ChatsService,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  async create(
    jobId: string,
    helperId: string,
    createDto: CreateApplicationDto,
  ): Promise<Application> {
    const job = await this.jobsService.findById(jobId);

    if (job.requesterId === helperId) {
      throw new BadRequestException('본인의 일에는 지원할 수 없습니다');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new BadRequestException('마감된 일에는 지원할 수 없습니다');
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: { jobId, helperId },
    });

    if (existingApplication) {
      throw new ConflictException('이미 지원한 일입니다');
    }

    const application = this.applicationRepository.create({
      jobId,
      helperId,
      message: createDto.message,
      proposedPay: createDto.proposedPay,
    });

    const saved = await this.applicationRepository.save(application);
    await this.jobsService.incrementAppliedCount(jobId);

    // Send notification to requester
    await this.notificationsService.create({
      userId: job.requesterId,
      type: NotificationType.JOB_APPLIED,
      title: '새로운 지원자',
      body: `${job.title}에 새로운 지원자가 있습니다`,
      referenceType: 'application',
      referenceId: saved.id,
    });

    return saved;
  }

  async findByJobId(jobId: string, requesterId: string): Promise<Application[]> {
    const job = await this.jobsService.findById(jobId);

    if (job.requesterId !== requesterId) {
      throw new ForbiddenException('지원자 목록을 볼 권한이 없습니다');
    }

    return this.applicationRepository.find({
      where: { jobId, status: ApplicationStatus.PENDING },
      relations: ['helper'],
      order: { appliedAt: 'DESC' },
    });
  }

  async findByHelperId(helperId: string): Promise<Application[]> {
    return this.applicationRepository.find({
      where: { helperId },
      relations: ['job', 'job.requester'],
      order: { appliedAt: 'DESC' },
    });
  }

  async accept(id: string, requesterId: string): Promise<Application> {
    const application = await this.findById(id);
    const job = await this.jobsService.findById(application.jobId);

    if (job.requesterId !== requesterId) {
      throw new ForbiddenException('수락 권한이 없습니다');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('이미 처리된 지원입니다');
    }

    if (job.matchedCount >= job.helperCount) {
      throw new BadRequestException('모집 인원이 마감되었습니다');
    }

    // Use transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update application status
      application.status = ApplicationStatus.ACCEPTED;
      application.respondedAt = new Date();
      await queryRunner.manager.save(application);

      // Create match
      const match = await this.matchesService.create(
        application.jobId,
        application.id,
        application.helperId,
        job.requesterId,
        application.proposedPay || job.payAmount,
      );

      // Create chat room
      await this.chatsService.createRoom(
        job.id,
        match.id,
        job.requesterId,
        application.helperId,
      );

      // Update job matched count
      await this.jobsService.incrementMatchedCount(job.id);

      // Update job status if all helpers matched
      if (job.matchedCount + 1 >= job.helperCount) {
        await this.jobsService.updateStatus(job.id, JobStatus.IN_PROGRESS);
      }

      // Send notification
      await this.notificationsService.create({
        userId: application.helperId,
        type: NotificationType.APPLICATION_ACCEPTED,
        title: '지원 수락',
        body: `${job.title} 지원이 수락되었습니다`,
        referenceType: 'match',
        referenceId: match.id,
      });

      await queryRunner.commitTransaction();
      return application;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reject(id: string, requesterId: string): Promise<Application> {
    const application = await this.findById(id);
    const job = await this.jobsService.findById(application.jobId);

    if (job.requesterId !== requesterId) {
      throw new ForbiddenException('거절 권한이 없습니다');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('이미 처리된 지원입니다');
    }

    application.status = ApplicationStatus.REJECTED;
    application.respondedAt = new Date();
    await this.applicationRepository.save(application);

    // Send notification
    await this.notificationsService.create({
      userId: application.helperId,
      type: NotificationType.APPLICATION_REJECTED,
      title: '지원 결과',
      body: `${job.title} 지원이 거절되었습니다`,
      referenceType: 'application',
      referenceId: application.id,
    });

    return application;
  }

  async cancel(id: string, helperId: string): Promise<void> {
    const application = await this.findById(id);

    if (application.helperId !== helperId) {
      throw new ForbiddenException('취소 권한이 없습니다');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('대기 중인 지원만 취소할 수 있습니다');
    }

    application.status = ApplicationStatus.CANCELLED;
    await this.applicationRepository.save(application);
    await this.jobsService.decrementAppliedCount(application.jobId);
  }

  private async findById(id: string): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['helper', 'job'],
    });

    if (!application) {
      throw new NotFoundException('지원을 찾을 수 없습니다');
    }

    return application;
  }
}
