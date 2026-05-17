import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

// Проверяем наличие секретного ключа
if (!process.env.BETTER_AUTH_SECRET) {
  console.error('❌ BETTER_AUTH_SECRET is not set in environment variables');
}

console.log('🔵 [auth] Starting custom auth initialization...');

// Проверяем наличие подключения к БД
if (!db) {
  console.error('❌ Database connection is not available. Please set DATABASE_URL');
}

// Простая кастомная аутентификация
const auth = {
  // Регистрация
  signUp: async (email: string, password: string, name: string) => {
    if (!db) {
      throw new Error('Database connection is not available. Please check DATABASE_URL environment variable.');
    }
    
    try {
      // Проверка, существует ли пользователь
      const existing = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      
      if (existing) {
        throw new Error('User already exists');
      }
      
      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Создание пользователя
      const userId = nanoid();
      const now = new Date().toISOString();
      
      const user = await db.insert(schema.users).values({
        id: userId,
        name,
        email,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      }).returning();
      
      // Создание записи в accounts для пароля
      const accountId = nanoid();
      await db.insert(schema.accounts).values({
        id: accountId,
        accountId: userId,
        providerId: 'credentials',
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      });
      
      // Создание сессии
      const sessionId = nanoid();
      const session = await db.insert(schema.sessions).values({
        id: sessionId,
        userId: userId,
        token: nanoid(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      }).returning();
      
      return { user: user[0], session: session[0] };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  },
  
  // Вход
  signIn: async (email: string, password: string) => {
    if (!db) {
      throw new Error('Database connection is not available. Please check DATABASE_URL environment variable.');
    }
    
    try {
      // Поиск пользователя
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email),
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Поиск пароля в accounts
      const account = await db.query.accounts.findFirst({
        where: eq(schema.accounts.userId, user.id),
      });
      
      if (!account || !account.password) {
        throw new Error('Password not set for this user');
      }
      
      // Проверка пароля
      const isValid = await bcrypt.compare(password, account.password);
      
      if (!isValid) {
        throw new Error('Invalid password');
      }
      
      // Создание сессии
      const sessionId = nanoid();
      const now = new Date().toISOString();
      
      const session = await db.insert(schema.sessions).values({
        id: sessionId,
        userId: user.id,
        token: nanoid(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now,
        updatedAt: now,
      }).returning();
      
      return { user, session: session[0] };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  },
  
  // Выход
  signOut: async (sessionId: string) => {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
  },
  
  // Получение сессии
  getSession: async (token: string) => {
    const session = await db.query.sessions.findFirst({
      where: eq(schema.sessions.token, token),
      with: {
        user: true,
      },
    });
    
    return session;
  },
};

console.log('✅ [auth] Custom auth initialized successfully!');

export type Session = any;
export type User = any;

// Экспортируем auth как объект с обработчиками
export { auth };
