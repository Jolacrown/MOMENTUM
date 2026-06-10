import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis };

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Helper keys for Momentum
export const REDIS_KEYS = {
  STREAK_CACHE: (userId: string) => `streak:${userId}`,
  DASHBOARD_CACHE: (userId: string) => `dashboard:${userId}`,
  SESSION_CACHE: (userId: string) => `session:${userId}`,
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
};
