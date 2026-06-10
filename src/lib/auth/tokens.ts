import jwt from 'jsonwebtoken';
import { redis, REDIS_KEYS } from '../redis';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface TokenPayload {
  userId: string;
  role?: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { 
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` 
  });
};

export const storeRefreshTokenInCache = async (userId: string, token: string) => {
  await redis.set(
    REDIS_KEYS.SESSION_CACHE(userId),
    token,
    'EX',
    REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
};
