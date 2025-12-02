import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { PushNotificationService } from './push-notification.service';
import { S3Service } from './s3.service';
import { TossPaymentsService } from './toss-payments.service';

@Global()
@Module({
  providers: [
    SmsService,
    PushNotificationService,
    S3Service,
    TossPaymentsService,
  ],
  exports: [
    SmsService,
    PushNotificationService,
    S3Service,
    TossPaymentsService,
  ],
})
export class ServicesModule {}
