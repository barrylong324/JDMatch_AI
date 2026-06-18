import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { z } from 'zod'

// Load environment variables from root .env file if not already loaded
if (!process.env.OPENAI_API_KEY) {
    const envPath = resolve(process.cwd(), '.env')
    const result = dotenv.config({ path: envPath })

    if (result.parsed) {
        console.log(`✅ Loaded environment variables from: ${envPath}`)
    } else {
        console.warn('⚠️ Could not load .env file from:', envPath)
    }
}

// ============================================
// Environment Variable Validation Schema
// ============================================

const envSchema = z.object({
    // Application
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.string().default('4000'),

    // Database
    DATABASE_URL: z.string().url(),
    DIRECT_DATABASE_URL: z.string().url().optional(),

    // Redis
    REDIS_URL: z.string().url().default('redis://localhost:6379'),

    // OpenAI
    OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
    OPENAI_MODEL: z.string().default('gpt-3.5-turbo'),
    OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-ada-002'),

    // Authentication
    NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: z.string().url(),
    JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

    // GitHub OAuth
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_CALLBACK_URL: z.string().url().optional(),

    // File Storage (AWS S3 / Cloudflare R2 / Alibaba OSS / MinIO)
    AWS_S3_BUCKET: z.string().optional(),
    AWS_S3_REGION: z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_S3_ENDPOINT: z.string().url().optional(),
    AWS_S3_FORCE_PATH_STYLE: z.string().optional(),

    // Frontend
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url(),

    // Rate Limiting
    RATE_LIMIT_TTL: z.string().default('60'),
    RATE_LIMIT_MAX: z.string().default('100'),
})

export type EnvConfig = z.infer<typeof envSchema>

// ============================================
// Validate and export environment variables
// ============================================

let config: EnvConfig

try {
    config = envSchema.parse(process.env)
} catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Invalid environment variables:')
        console.error(error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n'))
        throw new Error('Invalid environment variables. Check .env file.')
    }
    throw error
}

export { config }

// ============================================
// Helper functions
// ============================================

export const isDevelopment = config.NODE_ENV === 'development'
export const isProduction = config.NODE_ENV === 'production'
export const isTest = config.NODE_ENV === 'test'

export const getPort = () => parseInt(config.PORT, 10)
export const getRateLimitTtl = () => parseInt(config.RATE_LIMIT_TTL, 10)
export const getRateLimitMax = () => parseInt(config.RATE_LIMIT_MAX, 10)
