import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pgTid: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;
}
