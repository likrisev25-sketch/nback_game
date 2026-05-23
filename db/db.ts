import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

console.log('🔵 [db] Initializing database connection...');
console.log('🔵 [db] NODE_ENV:', process.env.NODE_ENV);
console.log('🔵 [db] DATABASE_URL set:', !!process.env.DATABASE_URL);

let db = null;

// Проверяем, есть ли DATABASE_URL
if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    db = drizzle(sql, { schema });
    console.log('✅ [db] Connected to Neon PostgreSQL');
  } catch (error) {
    console.warn('⚠️ [db] Failed to connect to Neon, falling back to SQLite:', error.message);
  }
}

// Если не удалось подключиться к Neon, используем SQLite
if (!db) {
  try {
    const sqlitePath = path.join(process.cwd(), 'nback.db');
    const sqlite = new Database(sqlitePath);
    db = drizzleSqlite(sqlite, { schema });
    console.log('✅ [db] Connected to local SQLite (nback.db)');
  } catch (error) {
    console.error('❌ [db] Failed to connect to SQLite:', error.message);
  }
}

// Экспортируем тип
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;

export { db };
