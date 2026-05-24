import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as path from 'path';

console.log('🔵 [db] Initializing SQLite database...');

// Для локальной разработки используем SQLite
const sqlitePath = path.join(process.cwd(), 'nback.db');
const sqlite = new Database(sqlitePath);

export const db = drizzle(sqlite, { schema });

console.log('✅ [db] Connected to SQLite:', sqlitePath);

// Экспортируем типы
export type User = typeof schema.users.$inferSelect;
export type GameSession = typeof schema.gameSessions.$inferSelect;
export type GamePlayer = typeof schema.gamePlayers.$inferSelect;
export type GameMove = typeof schema.gameMoves.$inferSelect;
export type TournamentResult = typeof schema.tournamentResults.$inferSelect;

