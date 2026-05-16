import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db/db';
import * as schema from '@/db/schema';

// Проверяем наличие секретного ключа
if (!process.env.BETTER_AUTH_SECRET) {
  console.error('❌ BETTER_AUTH_SECRET is not set in environment variables');
}

console.log('🔵 [auth] Starting Better Auth initialization...');
console.log('🔵 [auth] Secret length:', (process.env.BETTER_AUTH_SECRET || '').length);
console.log('🔵 [auth] Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔵 [auth] App URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set');

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-not-for-production',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    } as any,
  }),
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    modelName: 'sessions',
  },
  user: {
    modelName: 'users',
  },
  account: {
    modelName: 'accounts',
  },
  verification: {
    modelName: 'verifications',
  },
  advanced: {
    cookies: {},
    disableCSRFCheck: process.env.NODE_ENV === 'development',
  },
});

console.log('✅ [auth] Better Auth initialized successfully!');

export type Session = typeof auth.$Infer.Session;
