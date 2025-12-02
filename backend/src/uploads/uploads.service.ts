import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new BadRequestException('파일이 없습니다');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${uuidv4()}${ext}`;

    // In production, upload to S3
    // For now, return a mock URL
    const bucketName = this.configService.get('AWS_S3_BUCKET', 'daymatch-uploads');
    const region = this.configService.get('AWS_REGION', 'ap-northeast-2');

    // Mock S3 upload - in production, use AWS SDK
    // const s3 = new S3Client({ region });
    // await s3.send(new PutObjectCommand({
    //   Bucket: bucketName,
    //   Key: filename,
    //   Body: file.buffer,
    //   ContentType: file.mimetype,
    // }));

    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${filename}`;

    return { url, key: filename };
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<{ urls: string[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 없습니다');
    }

    if (files.length > 5) {
      throw new BadRequestException('최대 5개의 파일만 업로드할 수 있습니다');
    }

    const results = await Promise.all(
      files.map((file) => this.uploadImage(file, folder)),
    );

    return { urls: results.map((r) => r.url) };
  }

  async deleteImage(key: string): Promise<void> {
    // In production, delete from S3
    // const s3 = new S3Client({ region: this.configService.get('AWS_REGION') });
    // await s3.send(new DeleteObjectCommand({
    //   Bucket: this.configService.get('AWS_S3_BUCKET'),
    //   Key: key,
    // }));
  }
}
