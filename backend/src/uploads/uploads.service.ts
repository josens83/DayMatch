import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Service } from '../common/services/s3.service';
import { LoggerService } from '../common/logger/logger.service';

interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  thumbnailKey?: string;
}

@Injectable()
export class UploadsService {
  constructor(
    private s3Service: S3Service,
    private logger: LoggerService,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<UploadResult> {
    try {
      const result = await this.s3Service.uploadImage(file, folder);
      this.logger.log(`Image uploaded: ${result.key}`, 'UploadsService');
      return result;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`, error.stack, 'UploadsService');
      throw error;
    }
  }

  async uploadProfileImage(
    file: Express.Multer.File,
    userId: string,
  ): Promise<UploadResult> {
    try {
      const result = await this.s3Service.uploadProfileImage(file, userId);
      this.logger.log(`Profile image uploaded for user: ${userId}`, 'UploadsService');
      return result;
    } catch (error) {
      this.logger.error(`Profile upload failed: ${error.message}`, error.stack, 'UploadsService');
      throw error;
    }
  }

  async uploadJobImage(
    file: Express.Multer.File,
    jobId: string,
  ): Promise<UploadResult> {
    try {
      const result = await this.s3Service.uploadJobImage(file, jobId);
      this.logger.log(`Job image uploaded for job: ${jobId}`, 'UploadsService');
      return result;
    } catch (error) {
      this.logger.error(`Job image upload failed: ${error.message}`, error.stack, 'UploadsService');
      throw error;
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<{ results: UploadResult[] }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 없습니다');
    }

    if (files.length > 10) {
      throw new BadRequestException('최대 10개의 파일만 업로드할 수 있습니다');
    }

    try {
      const results = await this.s3Service.uploadMultipleImages(files, folder);
      this.logger.log(`${results.length} images uploaded to ${folder}`, 'UploadsService');
      return { results };
    } catch (error) {
      this.logger.error(`Multiple upload failed: ${error.message}`, error.stack, 'UploadsService');
      throw error;
    }
  }

  async deleteImage(key: string): Promise<void> {
    try {
      await this.s3Service.deleteFile(key);
      this.logger.log(`Image deleted: ${key}`, 'UploadsService');
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`, error.stack, 'UploadsService');
      throw error;
    }
  }

  async getSignedUploadUrl(
    filename: string,
    contentType: string,
    folder: string = 'general',
  ): Promise<{ uploadUrl: string; key: string }> {
    const key = `${folder}/${Date.now()}_${filename}`;
    const uploadUrl = await this.s3Service.getSignedUploadUrl(key, contentType);

    this.logger.log(`Signed URL generated for: ${key}`, 'UploadsService');

    return { uploadUrl, key };
  }

  async getSignedDownloadUrl(key: string): Promise<string> {
    return this.s3Service.getSignedDownloadUrl(key);
  }
}
