export default () => ({
  // Application
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
    name: 'DayMatch API',
    version: '1.0.0',
    apiPrefix: 'api',
  },

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'daymatch_user',
    password: process.env.DATABASE_PASSWORD || '',
    name: process.env.DATABASE_NAME || 'daymatch',
    ssl: process.env.DATABASE_SSL === 'true',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },

  // AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'ap-northeast-2',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'daymatch-uploads',
      cdnUrl: process.env.AWS_CLOUDFRONT_URL || '',
    },
  },

  // SMS (NHN Cloud / Aligo etc.)
  sms: {
    provider: process.env.SMS_PROVIDER || 'aligo',
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
    sender: process.env.SMS_SENDER || '',
  },

  // Firebase (FCM)
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },

  // Payment (Toss Payments)
  payment: {
    provider: 'toss',
    clientKey: process.env.TOSS_CLIENT_KEY || '',
    secretKey: process.env.TOSS_SECRET_KEY || '',
    webhookSecret: process.env.TOSS_WEBHOOK_SECRET || '',
    baseUrl: process.env.TOSS_BASE_URL || 'https://api.tosspayments.com',
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // Monitoring
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
  },

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
});
