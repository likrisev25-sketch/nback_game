import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(process.cwd(), 'nback.db');

const db = new Database(dbPath);

console.log('📦 Setting up tournament tables...');

const createTables = `
-- Таблица турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    n_value INTEGER NOT NULL DEFAULT 2,
    total_steps INTEGER NOT NULL DEFAULT 30,
    base_speed_ms INTEGER NOT NULL DEFAULT 2000,
    max_rounds INTEGER NOT NULL DEFAULT 5,
    current_round INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'waiting',
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 2,
    current_players INTEGER NOT NULL DEFAULT 0,
    host_id TEXT NOT NULL,
    password TEXT,
    created_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT
);

-- Таблица игроков в турнире
CREATE TABLE IF NOT EXISTS tournament_players (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_ready INTEGER NOT NULL DEFAULT 0,
    is_host INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL,
    UNIQUE(tournament_id, user_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_user_id ON tournament_players(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
`;

try {
  db.exec(createTables);
  console.log('✅ Tournament tables created successfully!');
  
  // Проверяем созданные таблицы
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tables:', tables.map(t => t.name).join(', '));
  
  // Проверяем структуру tournaments
  const columns = db.prepare("PRAGMA table_info(tournaments)").all();
  console.log('📋 Tournaments columns:', columns.map(c => c.name).join(', '));
} catch (error) {
  console.error('❌ Error creating tables:', error);
} finally {
  db.close();
}
