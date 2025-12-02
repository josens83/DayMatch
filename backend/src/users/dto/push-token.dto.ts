import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPushTokenDto {
  @ApiProperty({
    description: 'Push notification token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Platform type',
    enum: ['ios', 'android'],
    example: 'ios',
  })
  @IsEnum(['ios', 'android'])
  platform: 'ios' | 'android';

  @ApiPropertyOptional({
    description: 'Device type (phone, tablet, etc)',
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Device name',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class UnregisterPushTokenDto {
  @ApiProperty({
    description: 'Push notification token to remove',
  })
  @IsString()
  token: string;
}

export class SetPushEnabledDto {
  @ApiProperty({
    description: 'Whether push notifications should be enabled',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;
}
