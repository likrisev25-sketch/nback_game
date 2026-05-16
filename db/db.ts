import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Проверяем, что DATABASE_URL существует
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  throw new Error('DATABASE_URL is required');
}

// Создаём подключение к Neon PostgreSQL
const sql = neon(process.env.DATABASE_URL);

// Создаём экземпляр drizzle с подключением и схемой
export const db = drizzle(sql, { schema });

// Экспортируем типы для удобной работы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;
