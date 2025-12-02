import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDateString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayType, GenderPrefer } from '../entities/job.entity';

export class CreateJobDto {
  @ApiProperty({ example: '이사 도우미 구합니다' })
  @IsString()
  @IsNotEmpty({ message: '제목은 필수입니다' })
  @MinLength(5, { message: '제목은 최소 5자 이상이어야 합니다' })
  @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다' })
  title: string;

  @ApiProperty({ example: '2층에서 3층으로 짐 옮기는 일입니다.' })
  @IsString()
  @IsNotEmpty({ message: '설명은 필수입니다' })
  @MinLength(10, { message: '설명은 최소 10자 이상이어야 합니다' })
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  subCategoryId?: number;

  @ApiProperty({ example: '2024-12-15' })
  @IsDateString()
  @IsNotEmpty({ message: '작업 날짜는 필수입니다' })
  workDate: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty({ message: '시작 시간은 필수입니다' })
  startTime: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  durationHours?: number;

  @ApiProperty({ example: '서울시 강남구 테헤란로 123' })
  @IsString()
  @IsNotEmpty({ message: '주소는 필수입니다' })
  address: string;

  @ApiPropertyOptional({ example: '3층 302호' })
  @IsOptional()
  @IsString()
  addressDetail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: '서울' })
  @IsOptional()
  @IsString()
  sido?: string;

  @ApiPropertyOptional({ example: '강남구' })
  @IsOptional()
  @IsString()
  sigungu?: string;

  @ApiProperty({ enum: PayType, example: PayType.HOURLY })
  @IsEnum(PayType)
  payType: PayType;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(9860, { message: '최저시급 이상이어야 합니다' })
  payAmount: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  helperCount?: number;

  @ApiPropertyOptional({ example: '무거운 짐을 들 수 있어야 합니다' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ example: '이사 경험자 우대' })
  @IsOptional()
  @IsString()
  preferred?: string;

  @ApiPropertyOptional({ enum: GenderPrefer, default: GenderPrefer.ANY })
  @IsOptional()
  @IsEnum(GenderPrefer)
  genderPrefer?: GenderPrefer;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
