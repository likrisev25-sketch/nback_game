import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Проверяем тип базы данных из DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Для PostgreSQL используем postgres-js драйвер
const connectionString = databaseUrl.replace('postgres://', 'postgresql://');

const client = postgres(connectionString, {
  prepare: false, // Отключаем prepared statements для Serverless
});

// Создаём экземпляр drizzle с подключением и схемой
export const db = drizzle(client, { schema });

// Экспортируем типы для удобной работы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;
