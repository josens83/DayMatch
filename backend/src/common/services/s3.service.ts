import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { LoggerService } from '../logger/logger.service';

interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
}

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;
  private readonly region: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.region = this.configService.get('aws.region') || 'ap-northeast-2';
    this.bucket = this.configService.get('aws.s3.bucket') || 'daymatch-uploads';
    this.cdnUrl = this.configService.get('aws.s3.cdnUrl') || '';

    const accessKeyId = this.configService.get('aws.accessKeyId');
    const secretAccessKey = this.configService.get('aws.secretAccessKey');

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      this.logger.warn('AWS credentials not configured, using mock S3', 'S3Service');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
    options: ImageOptions = {},
  ): Promise<UploadResult> {
    this.validateFile(file);

    const {
      width = 1200,
      height = 1200,
      quality = 80,
      format = 'webp',
    } = options;

    // Process image
    let processedBuffer = await sharp(file.buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();

    const filename = `${folder}/${uuidv4()}.${format}`;

    // Create thumbnail
    const thumbnailBuffer = await sharp(file.buffer)
      .resize(300, 300, {
        fit: 'cover',
      })
      .toFormat(format, { quality: 70 })
      .toBuffer();

    const thumbnailFilename = `${folder}/thumb_${uuidv4()}.${format}`;

    // Upload to S3
    if (this.s3Client) {
      await Promise.all([
        this.uploadToS3(filename, processedBuffer, `image/${format}`),
        this.uploadToS3(thumbnailFilename, thumbnailBuffer, `image/${format}`),
      ]);
    } else {
      this.logger.debug(`[DEV S3] Would upload: ${filename}`, 'S3Service');
    }

    return {
      url: this.getPublicUrl(filename),
      key: filename,
      thumbnailUrl: this.getPublicUrl(thumbnailFilename),
      thumbnailKey: thumbnailFilename,
    };
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'general',
    options: ImageOptions = {},
  ): Promise<UploadResult[]> {
    if (files.length > 10) {
      throw new BadRequestException('최대 10개의 파일만 업로드할 수 있습니다');
    }

    return Promise.all(
      files.map((file) => this.uploadImage(file, folder, options)),
    );
  }

  async uploadProfileImage(file: Express.Multer.File, userId: string): Promise<UploadResult> {
    return this.uploadImage(file, `profiles/${userId}`, {
      width: 500,
      height: 500,
      quality: 85,
      format: 'webp',
    });
  }

  async uploadJobImage(file: Express.Multer.File, jobId: string): Promise<UploadResult> {
    return this.uploadImage(file, `jobs/${jobId}`, {
      width: 1200,
      height: 900,
      quality: 80,
      format: 'webp',
    });
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) {
      this.logger.debug(`[DEV S3] Would delete: ${key}`, 'S3Service');
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      this.logger.log(`Deleted from S3: ${key}`, 'S3Service');
    } catch (error) {
      this.logger.error(`S3 delete failed: ${error.message}`, error.stack, 'S3Service');
    }
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    if (!this.s3Client) {
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (!this.s3Client) {
      return this.getPublicUrl(key);
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=31536000',
      }),
    );
    this.logger.log(`Uploaded to S3: ${key}`, 'S3Service');
  }

  private getPublicUrl(key: string): string {
    if (this.cdnUrl) {
      return `${this.cdnUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('파일이 없습니다');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');
    }
  }
}
