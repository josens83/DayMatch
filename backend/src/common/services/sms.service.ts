import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LoggerService } from '../logger/logger.service';

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly provider: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly sender: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.provider = this.configService.get('sms.provider') || 'aligo';
    this.apiKey = this.configService.get('sms.apiKey') || '';
    this.apiSecret = this.configService.get('sms.apiSecret') || '';
    this.sender = this.configService.get('sms.sender') || '';
  }

  async sendVerificationCode(phone: string, code: string): Promise<SmsResponse> {
    const message = `[DayMatch] 인증번호는 [${code}]입니다. 3분 내로 입력해주세요.`;
    return this.send(phone, message);
  }

  async sendNotification(phone: string, title: string, body: string): Promise<SmsResponse> {
    const message = `[DayMatch] ${title}\n${body}`;
    return this.send(phone, message);
  }

  async sendMatchNotification(
    phone: string,
    jobTitle: string,
    helperName: string,
  ): Promise<SmsResponse> {
    const message = `[DayMatch] "${jobTitle}" 일자리에 ${helperName}님이 매칭되었습니다. 앱에서 확인해주세요.`;
    return this.send(phone, message);
  }

  async sendPaymentNotification(phone: string, amount: number): Promise<SmsResponse> {
    const message = `[DayMatch] ${amount.toLocaleString()}원이 정산되었습니다. 앱에서 확인해주세요.`;
    return this.send(phone, message);
  }

  private async send(phone: string, message: string): Promise<SmsResponse> {
    try {
      // Development mode - just log
      if (this.configService.get('app.env') === 'development' || !this.apiKey) {
        this.logger.log(`[DEV SMS] To: ${phone}, Message: ${message}`, 'SmsService');
        return { success: true, messageId: 'dev-' + Date.now() };
      }

      // Production - use actual SMS provider
      switch (this.provider) {
        case 'aligo':
          return await this.sendViaAligo(phone, message);
        case 'nhn':
          return await this.sendViaNhn(phone, message);
        default:
          throw new Error(`Unknown SMS provider: ${this.provider}`);
      }
    } catch (error) {
      this.logger.error(`SMS send failed: ${error.message}`, error.stack, 'SmsService');
      return { success: false, error: error.message };
    }
  }

  private async sendViaAligo(phone: string, message: string): Promise<SmsResponse> {
    const response = await axios.post('https://apis.aligo.in/send/', null, {
      params: {
        key: this.apiKey,
        user_id: this.apiSecret,
        sender: this.sender,
        receiver: phone,
        msg: message,
        msg_type: 'SMS',
      },
    });

    if (response.data.result_code === '1') {
      return { success: true, messageId: response.data.msg_id };
    } else {
      return { success: false, error: response.data.message };
    }
  }

  private async sendViaNhn(phone: string, message: string): Promise<SmsResponse> {
    const appKey = this.apiKey;
    const secretKey = this.apiSecret;

    const response = await axios.post(
      `https://api-sms.cloud.toast.com/sms/v3.0/appKeys/${appKey}/sender/sms`,
      {
        body: message,
        sendNo: this.sender,
        recipientList: [{ recipientNo: phone }],
      },
      {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': secretKey,
        },
      },
    );

    if (response.data.header.isSuccessful) {
      return { success: true, messageId: response.data.body.data.requestId };
    } else {
      return { success: false, error: response.data.header.resultMessage };
    }
  }
}
