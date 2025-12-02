import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Job, JobStatus } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { SearchJobsDto, SortBy } from './dto/search-jobs.dto';
import {
  PaginatedResult,
  PaginationMeta,
} from '../common/dto/pagination.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async create(requesterId: string, createJobDto: CreateJobDto): Promise<Job> {
    const job = this.jobRepository.create({
      ...createJobDto,
      requesterId,
    });
    return this.jobRepository.save(job);
  }

  async findAll(searchDto: SearchJobsDto): Promise<PaginatedResult<Job>> {
    const {
      page = 1,
      limit = 20,
      keyword,
      categoryId,
      subCategoryId,
      sido,
      sigungu,
      dateFrom,
      dateTo,
      payMin,
      payMax,
      payType,
      status,
      sortBy,
    } = searchDto;

    const query = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.requester', 'requester')
      .leftJoinAndSelect('job.category', 'category')
      .leftJoinAndSelect('job.subCategory', 'subCategory');

    // Default to open jobs
    if (status) {
      query.andWhere('job.status = :status', { status });
    } else {
      query.andWhere('job.status = :status', { status: JobStatus.OPEN });
    }

    // Keyword search
    if (keyword) {
      query.andWhere(
        '(job.title ILIKE :keyword OR job.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // Category filter
    if (categoryId) {
      query.andWhere('job.categoryId = :categoryId', { categoryId });
    }
    if (subCategoryId) {
      query.andWhere('job.subCategoryId = :subCategoryId', { subCategoryId });
    }

    // Location filter
    if (sido) {
      query.andWhere('job.sido = :sido', { sido });
    }
    if (sigungu) {
      query.andWhere('job.sigungu = :sigungu', { sigungu });
    }

    // Date filter
    if (dateFrom) {
      query.andWhere('job.workDate >= :dateFrom', { dateFrom });
    }
    if (dateTo) {
      query.andWhere('job.workDate <= :dateTo', { dateTo });
    }

    // Pay filter
    if (payMin) {
      query.andWhere('job.payAmount >= :payMin', { payMin });
    }
    if (payMax) {
      query.andWhere('job.payAmount <= :payMax', { payMax });
    }
    if (payType) {
      query.andWhere('job.payType = :payType', { payType });
    }

    // Sorting
    this.applySorting(query, sortBy || SortBy.RECENT);

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();
    const meta = new PaginationMeta(page, limit, total);

    return new PaginatedResult(items, meta);
  }

  async findById(id: string): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['requester', 'category', 'subCategory'],
    });

    if (!job) {
      throw new NotFoundException('일을 찾을 수 없습니다');
    }

    return job;
  }

  async findByRequesterId(requesterId: string): Promise<Job[]> {
    return this.jobRepository.find({
      where: { requesterId },
      relations: ['category', 'subCategory'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    requesterId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.findById(id);

    if (job.requesterId !== requesterId) {
      throw new ForbiddenException('수정 권한이 없습니다');
    }

    if (job.status !== JobStatus.OPEN) {
      throw new ForbiddenException('진행 중인 일은 수정할 수 없습니다');
    }

    Object.assign(job, updateJobDto);
    return this.jobRepository.save(job);
  }

  async delete(id: string, requesterId: string): Promise<void> {
    const job = await this.findById(id);

    if (job.requesterId !== requesterId) {
      throw new ForbiddenException('삭제 권한이 없습니다');
    }

    if (job.matchedCount > 0) {
      throw new ForbiddenException('매칭된 헬퍼가 있는 일은 삭제할 수 없습니다');
    }

    await this.jobRepository.remove(job);
  }

  async updateStatus(id: string, status: JobStatus): Promise<Job> {
    const job = await this.findById(id);
    job.status = status;
    return this.jobRepository.save(job);
  }

  async incrementAppliedCount(id: string): Promise<void> {
    await this.jobRepository.increment({ id }, 'appliedCount', 1);
  }

  async decrementAppliedCount(id: string): Promise<void> {
    await this.jobRepository.decrement({ id }, 'appliedCount', 1);
  }

  async incrementMatchedCount(id: string): Promise<void> {
    await this.jobRepository.increment({ id }, 'matchedCount', 1);
  }

  private applySorting(
    query: SelectQueryBuilder<Job>,
    sortBy: SortBy,
  ): void {
    switch (sortBy) {
      case SortBy.PAY_HIGH:
        query.orderBy('job.payAmount', 'DESC');
        break;
      case SortBy.PAY_LOW:
        query.orderBy('job.payAmount', 'ASC');
        break;
      case SortBy.DEADLINE:
        query.orderBy('job.workDate', 'ASC');
        break;
      case SortBy.RECENT:
      default:
        query.orderBy('job.createdAt', 'DESC');
        break;
    }
  }
}
