import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

console.log('🔵 [db] Initializing database connection...');
console.log('🔵 [db] NODE_ENV:', process.env.NODE_ENV);
console.log('🔵 [db] DATABASE_URL set:', !!process.env.DATABASE_URL);

// Подключаемся к Neon PostgreSQL в любом режиме
const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL)
  : null;

if (!sql) {
  console.error('❌ [db] DATABASE_URL is not set!');
}

// Создаём экземпляр drizzle с подключением и схемой
export const db = sql ? drizzle(sql, { schema }) : null;

if (db) {
  console.log('✅ [db] Database connection initialized successfully');
} else {
  console.warn('⚠️ [db] Database connection is null');
}

// Экспортируем типы для удобной работы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;
