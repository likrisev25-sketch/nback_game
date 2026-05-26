// Файл: db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import * as schema from './schema';

// Кэшируем подключение к БД для избежания множественных подключений
let cachedDb: any = null;
let cachedClient: any = null;

// Проверяем, какое подключение использовать
const databaseUrl = process.env.DATABASE_URL;

function isPostgresUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

function isNeonUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('neon') || url.includes('neon.tech');
}

// Определяем режим работы
const isServerless = typeof window === 'undefined' && 
  (process.env.VERCEL || process.env.NODE_ENV === 'production');

function initPostgres(): any {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  // Для Neon используем специальные настройки
  if (isNeonUrl(databaseUrl)) {
    // Убираем pooler из URL для прямого подключения
    const directUrl = databaseUrl.replace('-pooler', '');
    
    const client = postgres(directUrl, {
      max: 1, // Минимальное количество соединений для serverless
      prepare: false, // Отключаем prepared statements для serverless
      idle_timeout: 20, // Закрываем idle соединения
      connect_timeout: 10, // Таймаут подключения
      ssl: { rejectUnauthorized: false }, // SSL для Neon
    });
    
    cachedClient = client;
    return drizzle(client, { schema });
  } else {
    // Обычное PostgreSQL подключение
    const client = postgres(databaseUrl, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    cachedClient = client;
    return drizzle(client, { schema });
  }
}

function initSqlite(): any {
  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    const sqlitePath = path.join(process.cwd(), 'nback.db');
    const sqlite = new Database(sqlitePath);
    cachedClient = sqlite;
    return drizzleSqlite(sqlite, { schema });
  } catch (error) {
    console.error('[db] Failed to initialize SQLite:', error);
    throw error;
  }
}

// Экспортируем функцию для получения подключения к БД
export function getDb() {
  // Возвращаем кэшированное подключение если оно есть и валидно
  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  try {
    if (isPostgresUrl(databaseUrl)) {
      cachedDb = initPostgres();
    } else {
      cachedDb = initSqlite();
    }
    return cachedDb;
  } catch (error) {
    console.error('[db] Failed to initialize database:', error);
    throw error;
  }
}

// Для обратной совместимости экспортируем db как прокси
// Это позволит избежать проблем при импорте
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const dbInstance = getDb();
    return (dbInstance as any)[prop];
  }
});

// Экспортируем функцию для закрытия подключений (полезно для тестов)
export async function closeDb() {
  if (cachedClient) {
    if (typeof cachedClient.end === 'function') {
      await cachedClient.end();
    }
    cachedDb = null;
    cachedClient = null;
  }
}

// Экспортируем типы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;

