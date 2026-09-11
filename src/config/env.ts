import dotenv from 'dotenv'

dotenv.config()

type NodeEnv = 'development' | 'production' | 'test'
type MediaDriver = 'local' | 's3' | 'cloudinary' | 'imagekit'

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback
  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Set it in your host's environment settings (on Render: your web service → ` +
        `Environment → Add Environment Variable), then redeploy.`,
    )
  }
  return value
}

function optional(key: string): string | undefined {
  const value = process.env[key]
  return value === undefined || value === '' ? undefined : value
}

function int(key: string, fallback: number): number {
  const raw = process.env[key]
  if (raw === undefined || raw === '') return fallback
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, got "${raw}"`)
  }
  return parsed
}

export const env = {
  nodeEnv: (process.env.NODE_ENV ?? 'development') as NodeEnv,
  port: process.env.PORT || 4000,

  /** PostgreSQL connection string consumed by Prisma. */
  databaseUrl: required('DATABASE_URL'),

  /** Allowed CORS origins, parsed from a comma-separated list. */
  corsOrigins: required('CORS_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),

  // --- Auth -------------------------------------------------------------------
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-insecure-change-me-please-32-bytes'),
  jwtAccessTtl: int('JWT_ACCESS_TTL', 900), // seconds
  refreshTokenTtl: int('REFRESH_TOKEN_TTL', 2_592_000), // seconds (30 days)
  refreshCookieName: optional('REFRESH_COOKIE_NAME') ?? 'bassera_rt',
  bcryptCost: int('BCRYPT_COST', 12),
  bootstrapAdminEmail: (optional('BOOTSTRAP_ADMIN_EMAIL') ?? '').toLowerCase(),

  // --- Rate limiting --------------------------------------------------------
  rateLimitWindowMs: int('RATE_LIMIT_WINDOW_MS', 900_000),
  rateLimitMax: int('RATE_LIMIT_MAX', 300),
  redisUrl: optional('REDIS_URL'),

  // --- Media -------------------------------------------------------------------
  mediaDriver: (optional('MEDIA_DRIVER') ?? 'local') as MediaDriver,
  mediaMaxBytes: int('MEDIA_MAX_BYTES', 5_242_880),
  mediaPublicBaseUrl: optional('MEDIA_PUBLIC_BASE_URL') ?? 'http://localhost:4000/uploads',

  // ImageKit (only read when MEDIA_DRIVER=imagekit). Only the private key is
  // actually used server-side; public key / URL endpoint are kept for future
  // client-side upload or transformation-URL use.
  imagekitPublicKey: optional('IMAGEKIT_PUBLIC_KEY'),
  imagekitPrivateKey: optional('IMAGEKIT_PRIVATE_KEY'),
  imagekitUrlEndpoint: optional('IMAGEKIT_URL_ENDPOINT'),
}

export const isProduction = env.nodeEnv === 'production'
export const isDevelopment = env.nodeEnv === 'development'
