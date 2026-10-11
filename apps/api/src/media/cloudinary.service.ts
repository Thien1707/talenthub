import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private configured = false;

  constructor(private readonly config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      this.configured = true;
    }
  }

  ensureReady() {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET',
      );
    }
  }

  uploadBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      resourceType: 'image' | 'raw' | 'auto';
      deliveryType?: 'upload' | 'authenticated';
    },
  ): Promise<UploadApiResponse> {
    this.ensureReady();
    const deliveryType = options.deliveryType ?? 'upload';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: options.resourceType,
          type: deliveryType,
        },
        (err, result) => {
          if (err || !result) reject(err ?? new Error('Upload failed'));
          else resolve(result);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  getSignedUrl(
    publicId: string,
    resourceType: string,
    deliveryType: 'upload' | 'authenticated' = 'upload',
    expiresSec = 3600,
  ) {
    this.ensureReady();
    const expiresAt = Math.floor(Date.now() / 1000) + expiresSec;
    return cloudinary.url(publicId, {
      resource_type: resourceType,
      type: deliveryType,
      secure: true,
      sign_url: true,
      expires_at: expiresAt,
    });
  }
}
