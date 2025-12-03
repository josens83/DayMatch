import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ description: 'Toss Payments에서 발급한 paymentKey' })
  @IsString()
  @IsNotEmpty()
  paymentKey: string;

  @ApiProperty({ description: '주문 ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: '결제 금액' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
