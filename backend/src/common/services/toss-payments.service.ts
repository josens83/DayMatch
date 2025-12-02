import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LoggerService } from '../logger/logger.service';

interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

interface PaymentCancelRequest {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}

interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  method: string;
  totalAmount: number;
  approvedAt: string;
  receipt?: {
    url: string;
  };
  card?: {
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  virtualAccount?: {
    accountNumber: string;
    bankCode: string;
    dueDate: string;
  };
}

interface TossCancelResponse {
  paymentKey: string;
  cancels: {
    cancelAmount: number;
    cancelReason: string;
    canceledAt: string;
  }[];
}

@Injectable()
export class TossPaymentsService {
  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly clientKey: string;
  private readonly authorization: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.baseUrl = this.configService.get('payment.baseUrl') || 'https://api.tosspayments.com';
    this.secretKey = this.configService.get('payment.secretKey') || '';
    this.clientKey = this.configService.get('payment.clientKey') || '';
    this.authorization = Buffer.from(`${this.secretKey}:`).toString('base64');
  }

  getClientKey(): string {
    return this.clientKey;
  }

  async confirmPayment(request: PaymentConfirmRequest): Promise<TossPaymentResponse> {
    const { paymentKey, orderId, amount } = request;

    // Development mode
    if (!this.secretKey || this.configService.get('app.env') === 'development') {
      this.logger.log(`[DEV PAYMENT] Confirm: ${orderId}, Amount: ${amount}`, 'TossPaymentsService');
      return this.mockPaymentResponse(paymentKey, orderId, amount);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/payments/confirm`,
        { paymentKey, orderId, amount },
        {
          headers: {
            Authorization: `Basic ${this.authorization}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.logPayment('confirmed', {
        orderId,
        amount,
        paymentKey,
        method: response.data.method,
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Payment confirm failed: ${error.response?.data?.message || error.message}`,
        error.stack,
        'TossPaymentsService',
      );
      throw new BadRequestException(
        error.response?.data?.message || '결제 확인에 실패했습니다',
      );
    }
  }

  async cancelPayment(request: PaymentCancelRequest): Promise<TossCancelResponse> {
    const { paymentKey, cancelReason, cancelAmount } = request;

    // Development mode
    if (!this.secretKey || this.configService.get('app.env') === 'development') {
      this.logger.log(`[DEV PAYMENT] Cancel: ${paymentKey}, Reason: ${cancelReason}`, 'TossPaymentsService');
      return {
        paymentKey,
        cancels: [
          {
            cancelAmount: cancelAmount || 0,
            cancelReason,
            canceledAt: new Date().toISOString(),
          },
        ],
      };
    }

    try {
      const body: any = { cancelReason };
      if (cancelAmount) {
        body.cancelAmount = cancelAmount;
      }

      const response = await axios.post(
        `${this.baseUrl}/v1/payments/${paymentKey}/cancel`,
        body,
        {
          headers: {
            Authorization: `Basic ${this.authorization}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.logPayment('cancelled', {
        paymentKey,
        cancelReason,
        cancelAmount,
      });

      return response.data;
    } catch (error) {
      this.logger.error(
        `Payment cancel failed: ${error.response?.data?.message || error.message}`,
        error.stack,
        'TossPaymentsService',
      );
      throw new BadRequestException(
        error.response?.data?.message || '결제 취소에 실패했습니다',
      );
    }
  }

  async getPayment(paymentKey: string): Promise<TossPaymentResponse> {
    if (!this.secretKey) {
      return this.mockPaymentResponse(paymentKey, 'mock-order', 10000);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/${paymentKey}`,
        {
          headers: {
            Authorization: `Basic ${this.authorization}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message || '결제 정보 조회에 실패했습니다',
      );
    }
  }

  async getPaymentByOrderId(orderId: string): Promise<TossPaymentResponse> {
    if (!this.secretKey) {
      return this.mockPaymentResponse('mock-key', orderId, 10000);
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/payments/orders/${orderId}`,
        {
          headers: {
            Authorization: `Basic ${this.authorization}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new BadRequestException(
        error.response?.data?.message || '결제 정보 조회에 실패했습니다',
      );
    }
  }

  generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `DM${timestamp}${randomStr}`.toUpperCase();
  }

  private mockPaymentResponse(
    paymentKey: string,
    orderId: string,
    amount: number,
  ): TossPaymentResponse {
    return {
      paymentKey,
      orderId,
      status: 'DONE',
      method: '카드',
      totalAmount: amount,
      approvedAt: new Date().toISOString(),
      receipt: {
        url: 'https://dashboard.tosspayments.com/receipt/mock',
      },
      card: {
        company: '삼성카드',
        number: '433012******1234',
        installmentPlanMonths: 0,
      },
    };
  }
}
