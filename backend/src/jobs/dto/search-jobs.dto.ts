import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PayType, JobStatus } from '../entities/job.entity';

export enum SortBy {
  RECENT = 'recent',
  PAY_HIGH = 'pay_high',
  PAY_LOW = 'pay_low',
  DEADLINE = 'deadline',
}

export class SearchJobsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subCategoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sido?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sigungu?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  payMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  payMax?: number;

  @ApiPropertyOptional({ enum: PayType })
  @IsOptional()
  @IsEnum(PayType)
  payType?: PayType;

  @ApiPropertyOptional({ enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ enum: SortBy, default: SortBy.RECENT })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.RECENT;
}
