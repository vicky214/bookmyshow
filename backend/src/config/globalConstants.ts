import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const GLOBAL_CONSTANTS = {

  ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  INSTANCE_ID: process.env.INSTANCE_ID || `node-${Math.random().toString(36).substring(2, 7)}`,

  DATABASE: {
    HOST: process.env.MYSQL_HOST || '127.0.0.1',
    PORT: parseInt(process.env.MYSQL_PORT || '3306', 10),
    USER: process.env.MYSQL_USER || 'root',
    PASSWORD: process.env.MYSQL_PASSWORD || '',
    NAME: process.env.MYSQL_DATABASE || 'bookmyshow',
    CONNECTION_LIMIT: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '20', 10),
    CONNECT_TIMEOUT_MS: 5000,
  },

  REDIS: {
    HOST: process.env.REDIS_HOST || '127.0.0.1',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || undefined,
  },

  BUSINESS: {
    SEAT_LOCK_TTL_SECONDS: parseInt(process.env.SEAT_LOCK_TTL_SECONDS || '600', 10), // 10 Minutes hold
    SWEEPER_INTERVAL_MS: parseInt(process.env.SWEEPER_INTERVAL_MS || '5000', 10),    // Check every 5 seconds
    MAX_SEATS_PER_BOOKING: parseInt(process.env.MAX_SEATS_PER_BOOKING || '10', 10),
    CONVENIENCE_FEE_RATE: parseFloat(process.env.CONVENIENCE_FEE_RATE || '0.18'),    // 18% GST + Service fee
    BASE_CONVENIENCE_FEE_CENTS: parseInt(process.env.BASE_CONVENIENCE_FEE_CENTS || '3000', 10), // $30 / ₹30
    DEFAULT_CURRENCY: 'INR',
  },

  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || 'bms_enterprise_jwt_super_secret_2026_xyz',
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY || 'bms_admin_master_key_99218',
    DEFAULT_PARTNER_RATE_LIMIT_RPM: parseInt(process.env.DEFAULT_PARTNER_RATE_LIMIT_RPM || '120', 10),
    HMAC_MAX_CLOCK_SKEW_SECONDS: parseInt(process.env.HMAC_MAX_CLOCK_SKEW_SECONDS || '300', 10), // 5 min skew
  },

  SEAT_TIERS: {
    RECLINER: { name: 'RECLINER', basePriceCents: 45000, color: '#f59e0b' }, // ₹450
    PRIME: { name: 'PRIME', basePriceCents: 28000, color: '#3b82f6' },       // ₹280
    CLASSIC: { name: 'CLASSIC', basePriceCents: 18000, color: '#10b981' },   // ₹180
  },

  SEAT_STATUS: {
    AVAILABLE: 'AVAILABLE',
    LOCKED: 'LOCKED',
    BOOKED: 'BOOKED',
    BLOCKED: 'BLOCKED',
  } as const,

  BOOKING_STATUS: {
    INITIATED: 'INITIATED',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    EXPIRED: 'EXPIRED',
  } as const,
} as const;

export type SeatStatus = typeof GLOBAL_CONSTANTS.SEAT_STATUS[keyof typeof GLOBAL_CONSTANTS.SEAT_STATUS];
export type BookingStatus = typeof GLOBAL_CONSTANTS.BOOKING_STATUS[keyof typeof GLOBAL_CONSTANTS.BOOKING_STATUS];
