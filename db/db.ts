import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

console.log('🔵 [db] Initializing database connection...');
console.log('🔵 [db] NODE_ENV:', process.env.NODE_ENV);
console.log('🔵 [db] DATABASE_URL set:', !!process.env.DATABASE_URL);

// Для Vercel используем только Neon PostgreSQL
const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL)
  : null;

if (!sql) {
  console.error('❌ [db] DATABASE_URL is not set!');
  throw new Error('DATABASE_URL environment variable is required');
}

export const db = drizzle(sql, { schema });

console.log('✅ [db] Connected to Neon PostgreSQL');

// Экспортируем типы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;

