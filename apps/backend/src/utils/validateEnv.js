// =============================================================================
// Environment Variable Validation
// =============================================================================
// Validates all required environment variables at startup
// Prevents the application from starting with missing or invalid configuration

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // ── Node Environment ─────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('5000'),

  // ── Database URLs ────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  // ── JWT Configuration ────────────────────────────────────────────────────
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ── CORS Configuration ───────────────────────────────────────────────────
  FRONTEND_URL: z.string().optional(),

  // ── Cloudinary Configuration ─────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // ── Email Configuration (Resend) ─────────────────────────────────────────
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key format'),
  EMAIL_FROM: z.string().email().default('noreply@example.com'),

  // ── Payment Gateway (Razorpay) ───────────────────────────────────────────
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  ENABLE_RAZORPAY: z.string().transform(val => val === 'true').default('false'),

  // ── Rate Limiting ────────────────────────────────────────────────────────
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).transform(Number).default('200'),

  // ── Monitoring Configuration ─────────────────────────────────────────────
  LOKI_HOST: z.string().url().optional(),
  ENABLE_FILE_LOGGING: z.string().transform(val => val === 'true').default('true'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug']).default('info'),

  // ── Error Tracking (Sentry) ──────────────────────────────────────────────
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().regex(/^0(\.\d+)?$|^1(\.0+)?$/).transform(Number).default('0.1'),

  // ── Session Configuration ────────────────────────────────────────────────
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET must be at least 32 characters').optional(),

  // ── File Upload Configuration ────────────────────────────────────────────
  MAX_FILE_SIZE: z.string().regex(/^\d+$/).transform(Number).default('5242880'), // 5MB
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),

  // ── Cache Configuration ──────────────────────────────────────────────────
  CACHE_TTL_DEFAULT: z.string().regex(/^\d+$/).transform(Number).default('3600'), // 1 hour
  CACHE_TTL_USER: z.string().regex(/^\d+$/).transform(Number).default('300'), // 5 minutes
  CACHE_TTL_PRODUCT: z.string().regex(/^\d+$/).transform(Number).default('3600'), // 1 hour
  CACHE_TTL_CART: z.string().regex(/^\d+$/).transform(Number).default('2592000'), // 30 days

  // ── Background Jobs Configuration ────────────────────────────────────────
  QUEUE_REDIS_URL: z.string()
    .startsWith('redis://')
    .default(process.env.REDIS_URL || 'redis://localhost:6379'),
  QUEUE_CONCURRENCY: z.string().regex(/^\d+$/).transform(Number).default('5'),

  // ── Security Configuration ───────────────────────────────────────────────
  BCRYPT_ROUNDS: z.string().regex(/^\d+$/).transform(Number).default('12'),
  OTP_EXPIRY_MINUTES: z.string().regex(/^\d+$/).transform(Number).default('10'),
  MAX_LOGIN_ATTEMPTS: z.string().regex(/^\d+$/).transform(Number).default('5'),
  ACCOUNT_LOCKOUT_DURATION: z.string().regex(/^\d+$/).transform(Number).default('900'), // 15 minutes

  // ── Feature Flags ────────────────────────────────────────────────────────
  ENABLE_SWAGGER: z.string().transform(val => val === 'true').default('false'),
  ENABLE_METRICS: z.string().transform(val => val === 'true').default('true'),
  ENABLE_AUDIT_LOGS: z.string().transform(val => val === 'true').default('true'),
});

/**
 * Validates environment variables against the schema
 * @throws {Error} If validation fails
 * @returns {Object} Validated and typed environment variables
 */
export function validateEnv() {
  try {
    const validated = envSchema.parse(process.env);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues?.map(err => {
        const path = err.path.join('.');
        const message = err.message;
        return `  ❌ ${path}: ${message}`;
      }) || ['Unknown validation error'];

      console.error('\n=============================================================================');
      console.error('❌ ENVIRONMENT VARIABLE VALIDATION FAILED');
      console.error('=============================================================================');
      console.error('The following environment variables are missing or invalid:\n');
      console.error(missingVars.join('\n'));
      console.error('\n=============================================================================');
      console.error('Please check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.');
      console.error('=============================================================================\n');

      process.exit(1);
    }
    
    // For non-Zod errors, log the full error
    console.error('\n=============================================================================');
    console.error('❌ UNEXPECTED ERROR DURING ENVIRONMENT VALIDATION');
    console.error('=============================================================================');
    console.error(error);
    console.error('=============================================================================\n');
    
    throw error;
  }
}

/**
 * Prints environment configuration (with sensitive values masked)
 * @param {Object} env - Validated environment variables
 */
export function printEnvConfig(env) {
  const maskSensitive = (key, value) => {
    const sensitiveKeys = [
      'JWT_SECRET',
      'DATABASE_URL',
      'MONGODB_URI',
      'REDIS_URL',
      'CLOUDINARY_API_SECRET',
      'RESEND_API_KEY',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'SESSION_SECRET',
      'CSRF_SECRET',
      'SENTRY_DSN',
    ];

    if (sensitiveKeys.includes(key)) {
      return '***MASKED***';
    }

    return value;
  };

  console.log('\n=============================================================================');
  console.log('✅ ENVIRONMENT CONFIGURATION');
  console.log('=============================================================================');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Port: ${env.PORT}`);
  console.log(`\n📦 Services:`);
  console.log(`  Database: ${env.DATABASE_URL ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  MongoDB: ${env.MONGODB_URI ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  Redis: ${env.REDIS_URL ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`\n🔐 Security:`);
  console.log(`  JWT Expiry: ${env.JWT_EXPIRES_IN}`);
  console.log(`  Refresh Token Expiry: ${env.JWT_REFRESH_EXPIRES_IN}`);
  console.log(`  BCrypt Rounds: ${env.BCRYPT_ROUNDS}`);
  console.log(`  Max Login Attempts: ${env.MAX_LOGIN_ATTEMPTS}`);
  console.log(`\n📧 Email:`);
  console.log(`  Provider: Resend`);
  console.log(`  From: ${env.EMAIL_FROM}`);
  console.log(`\n💳 Payment:`);
  console.log(`  Razorpay: ${env.ENABLE_RAZORPAY ? 'Enabled' : 'Disabled'}`);
  console.log(`\n📊 Monitoring:`);
  console.log(`  Loki: ${env.LOKI_HOST ? 'Configured' : 'Not configured'}`);
  console.log(`  File Logging: ${env.ENABLE_FILE_LOGGING ? 'Enabled' : 'Disabled'}`);
  console.log(`  Log Level: ${env.LOG_LEVEL}`);
  console.log(`  Metrics: ${env.ENABLE_METRICS ? 'Enabled' : 'Disabled'}`);
  console.log(`  Sentry: ${env.SENTRY_DSN ? 'Enabled' : 'Disabled'}`);
  console.log(`\n⚡ Performance:`);
  console.log(`  Cache TTL (Default): ${env.CACHE_TTL_DEFAULT}s`);
  console.log(`  Cache TTL (Product): ${env.CACHE_TTL_PRODUCT}s`);
  console.log(`  Cache TTL (User): ${env.CACHE_TTL_USER}s`);
  console.log(`  Queue Concurrency: ${env.QUEUE_CONCURRENCY}`);
  console.log(`\n🚦 Rate Limiting:`);
  console.log(`  Window: ${env.RATE_LIMIT_WINDOW_MS / 1000}s`);
  console.log(`  Max Requests: ${env.RATE_LIMIT_MAX_REQUESTS}`);
  console.log('=============================================================================\n');
}

/**
 * Checks database connections
 * @returns {Promise<Object>} Connection status for each database
 */
export async function checkDatabaseConnections() {
  const results = {
    postgres: false,
    mongodb: false,
    redis: false,
  };

  try {
    // Check PostgreSQL
    const { prisma } = await import('../config/Postgrsedb.js');
    await prisma.$queryRaw`SELECT 1`;
    results.postgres = true;
    console.log('✅ PostgreSQL connection successful');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
  }

  try {
    // Check MongoDB
    const mongoose = await import('mongoose');
    if (mongoose.default.connection.readyState === 1) {
      results.mongodb = true;
      console.log('✅ MongoDB connection successful');
    } else {
      console.error('❌ MongoDB connection failed: Not connected');
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
  }

  try {
    // Check Redis
    const { isRedisConnected } = await import('../config/Redis.js');
    if (isRedisConnected()) {
      results.redis = true;
      console.log('✅ Redis connection successful');
    } else {
      console.error('❌ Redis connection failed: Not connected');
    }
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
  }

  return results;
}

/**
 * Performs startup health checks
 * @returns {Promise<boolean>} True if all checks pass
 */
export async function performStartupChecks() {
  console.log('\n=============================================================================');
  console.log('🔍 PERFORMING STARTUP HEALTH CHECKS');
  console.log('=============================================================================\n');

  const connections = await checkDatabaseConnections();

  const allHealthy = Object.values(connections).every(status => status === true);

  if (allHealthy) {
    console.log('\n✅ All startup checks passed!');
  } else {
    console.log('\n⚠️  Some startup checks failed. Application may not function correctly.');
  }

  console.log('=============================================================================\n');

  return allHealthy;
}
