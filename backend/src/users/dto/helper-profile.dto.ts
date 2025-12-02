import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HelperProfileDto {
  @ApiProperty({ example: ['청소', '이사 도우미', '배달'] })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 기술을 입력해주세요' })
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({ example: ['서울 강남구', '서울 서초구'] })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1개 이상의 활동 지역을 입력해주세요' })
  @IsString({ each: true })
  availableAreas: string[];

  @ApiPropertyOptional({ example: '성실하게 일하겠습니다.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHolder?: string;
}
