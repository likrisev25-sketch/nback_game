import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Проверяем, какое подключение использовать
const databaseUrl = process.env.DATABASE_URL;

console.log('🔵 [db] Initializing database...');
console.log('🔵 [db] DATABASE_URL exists:', !!databaseUrl);
console.log('🔵 [db] DATABASE_URL starts with postgres:', databaseUrl?.startsWith('postgres'));

if (!databaseUrl) {
  console.warn('⚠️ [db] DATABASE_URL not found, falling back to SQLite for local development');
}

// Для продакшена на Vercel используем PostgreSQL через Neon
// Для локальной разработки используем SQLite
let db;

if (databaseUrl && databaseUrl.includes('neon')) {
  // PostgreSQL для Vercel/Neon
  console.log('✅ [db] Using PostgreSQL (Neon)');
  
  const client = postgres(databaseUrl, {
    max: 1, // Минимальное количество соединений для serverless
    prepare: false, // Отключаем prepared statements для serverless
    ssl: { rejectUnauthorized: false }, // SSL для Neon
  });
  
  db = drizzle(client, { schema });
  
  // Проверяем подключение
  client`SELECT 1 as test`.then(() => {
    console.log('✅ [db] Successfully connected to PostgreSQL');
  }).catch((err) => {
    console.error('❌ [db] Failed to connect to PostgreSQL:', err);
  });
} else {
  // SQLite для локальной разработки
  console.log('✅ [db] Using SQLite for local development');
  
  const Database = require('better-sqlite3');
  const path = require('path');
  const sqlitePath = path.join(process.cwd(), 'nback.db');
  const sqlite = new Database.default ? new Database.default(sqlitePath) : new Database(sqlitePath);
  db = drizzle(sqlite, { schema });
  console.log('✅ [db] Connected to SQLite:', sqlitePath);
}

export { db };

// Экспортируем типы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;

