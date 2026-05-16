import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(process.cwd(), 'nback.db');

const db = new Database(dbPath);

console.log('📦 Setting up database tables...');

const createTables = `
-- Таблица лобби
CREATE TABLE IF NOT EXISTS lobbies (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    n_value INTEGER NOT NULL DEFAULT 1,
    base_speed_ms INTEGER NOT NULL DEFAULT 2000,
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 2,
    current_players INTEGER NOT NULL DEFAULT 0,
    host_id TEXT NOT NULL,
    password TEXT,
    auto_start_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT
);

-- Таблица игроков в лобби
CREATE TABLE IF NOT EXISTS lobby_players (
    id TEXT PRIMARY KEY,
    lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_ready INTEGER NOT NULL DEFAULT 0,
    is_host INTEGER NOT NULL DEFAULT 0,
    connection_id TEXT,
    last_heartbeat TEXT,
    joined_at TEXT NOT NULL,
    UNIQUE(lobby_id, user_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobbyId ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_userId ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
`;

try {
  db.exec(createTables);
  console.log('✅ Database tables created successfully!');
  
  // Проверяем созданные таблицы
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Tables:', tables.map(t => t.name).join(', '));
  
  // Проверяем структуру lobbies
  const columns = db.prepare("PRAGMA table_info(lobbies)").all();
  console.log('📋 Lobbies columns:', columns.map(c => c.name).join(', '));
} catch (error) {
  console.error('❌ Error creating tables:', error);
} finally {
  db.close();
}
