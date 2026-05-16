import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// В production среде проверяем DATABASE_URL
// В development позволяем работать без неё (для тестов)
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in production');
  throw new Error('DATABASE_URL is required in production');
}

// Создаём подключение к Neon PostgreSQL
const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL)
  : null;

// Создаём экземпляр drizzle с подключением и схемой
export const db = sql ? drizzle(sql, { schema }) : null as any;

// Экспортируем типы для удобной работы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;
