import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job, JobStatus } from './entities/job.entity';
import { User } from '../users/entities/user.entity';

describe('JobsService', () => {
  let service: JobsService;
  let mockJobRepository: any;

  const mockUser: Partial<User> = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    name: '테스트',
  };

  const mockJob = {
    id: 'job-uuid-123',
    requesterId: 'user-uuid-123',
    title: '이사 도우미 구합니다',
    description: '짐 옮기기 도와주실 분',
    categoryId: 'category-uuid',
    address: '서울시 강남구',
    latitude: 37.5665,
    longitude: 126.978,
    scheduledDate: new Date(),
    estimatedDuration: 120,
    pay: 50000,
    status: JobStatus.OPEN,
    createdAt: new Date(),
    requester: mockUser,
  };

  beforeEach(async () => {
    mockJobRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockJob], 1]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createJobDto = {
      title: '새 일자리',
      description: '설명',
      categoryId: 'category-uuid',
      address: '서울시',
      latitude: 37.5,
      longitude: 127.0,
      scheduledDate: new Date(),
      estimatedDuration: 60,
      pay: 30000,
    };

    it('should create a new job', async () => {
      mockJobRepository.create.mockReturnValue({ ...createJobDto, id: 'new-uuid' });
      mockJobRepository.save.mockResolvedValue({ ...createJobDto, id: 'new-uuid' });

      const result = await service.create(createJobDto, 'user-uuid-123');

      expect(result).toHaveProperty('id');
      expect(mockJobRepository.create).toHaveBeenCalledWith({
        ...createJobDto,
        requesterId: 'user-uuid-123',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated jobs', async () => {
      const result = await service.findAll({}, 1, 10);

      expect(result).toHaveProperty('jobs');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('totalPages');
    });

    it('should filter by category', async () => {
      await service.findAll({ categoryId: 'category-uuid' }, 1, 10);

      expect(mockJobRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return job if found', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await service.findById('job-uuid-123');

      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException if not found', async () => {
      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateJobDto = {
      title: '수정된 제목',
    };

    it('should update job if owner', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockJobRepository.save.mockResolvedValue({ ...mockJob, ...updateJobDto });

      const result = await service.update('job-uuid-123', updateJobDto, 'user-uuid-123');

      expect(result.title).toBe('수정된 제목');
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      await expect(
        service.update('job-uuid-123', updateJobDto, 'other-user-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete job if owner', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);
      mockJobRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('job-uuid-123', 'user-uuid-123');

      expect(mockJobRepository.delete).toHaveBeenCalledWith('job-uuid-123');
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockJobRepository.findOne.mockResolvedValue(mockJob);

      await expect(service.remove('job-uuid-123', 'other-user-uuid')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findNearby', () => {
    it('should return nearby jobs', async () => {
      mockJobRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockJob]),
      });

      const result = await service.findNearby(37.5, 127.0, 5);

      expect(result).toHaveLength(1);
    });
  });
});
