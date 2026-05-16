import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(process.cwd(), 'db.sqlite');

const db = new Database(dbPath);

console.log('📦 Setting up tables for Better Auth and Lobby system...');

const createTables = `
-- Таблица пользователей
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    name TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    image TEXT
);

-- Таблица сессий
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Таблица аккаунтов
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope TEXT,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

-- Таблица верификации
CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER,
    updatedAt INTEGER
);

-- Таблица лобби
CREATE TABLE IF NOT EXISTS lobbies (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    n_value INTEGER NOT NULL DEFAULT 1,
    base_speed_ms INTEGER NOT NULL DEFAULT 2000,
    max_players INTEGER NOT NULL DEFAULT 2,
    current_players INTEGER NOT NULL DEFAULT 0,
    host_id TEXT NOT NULL,
    password TEXT,
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
CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobbyId ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_userId ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
`;

try {
  db.exec(createTables);
  console.log('✅ Database tables created successfully!');
  
  // Проверяем созданные таблицы
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Existing tables:', tables.map(t => t.name).join(', '));
} catch (error) {
  console.error('❌ Error creating tables:', error);
} finally {
  db.close();
}
