import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('prepare')
  @ApiOperation({ summary: '결제 준비' })
  @ApiResponse({ status: 201, description: '결제 준비 완료' })
  async prepare(
    @CurrentUser() user: User,
    @Body() body: { matchId: string },
  ) {
    return this.paymentsService.prepare(body.matchId, user.id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '결제 확인' })
  @ApiResponse({ status: 200, description: '결제 확인 완료' })
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() confirmDto: ConfirmPaymentDto,
  ) {
    return this.paymentsService.confirm(id, user.id, confirmDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '결제 상세' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findById(id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: '환불 요청' })
  @ApiResponse({ status: 200, description: '환불 완료' })
  async refund(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.refund(id, user.id);
  }
}
