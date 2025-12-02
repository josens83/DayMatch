import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationDto {
  @ApiProperty({ example: '01012345678' })
  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수입니다' })
  @Matches(/^01[0-9]{8,9}$/, { message: '유효한 전화번호 형식이 아닙니다' })
  phone: string;
}

export class ConfirmVerificationDto {
  @ApiProperty({ example: '01012345678' })
  @IsString()
  @IsNotEmpty({ message: '전화번호는 필수입니다' })
  @Matches(/^01[0-9]{8,9}$/, { message: '유효한 전화번호 형식이 아닙니다' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '인증번호는 필수입니다' })
  @Length(6, 6, { message: '인증번호는 6자리입니다' })
  code: string;
}
