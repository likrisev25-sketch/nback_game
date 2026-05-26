-- Migration: Add lobbies and lobby_players tables
-- Execute this on your production database (Neon PostgreSQL)

-- Create lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  n_value INTEGER NOT NULL DEFAULT 2,
  base_speed_ms INTEGER NOT NULL DEFAULT 2000,
  min_players INTEGER NOT NULL DEFAULT 2,
  max_players INTEGER NOT NULL DEFAULT 2,
  current_players INTEGER NOT NULL DEFAULT 0,
  host_id TEXT NOT NULL,
  password TEXT,
  auto_start_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT
);

-- Create lobby_players table
CREATE TABLE IF NOT EXISTS lobby_players (
  id TEXT PRIMARY KEY,
  lobby_id TEXT NOT NULL REFERENCES lobbies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_accuracy INTEGER NOT NULL DEFAULT 100,
  connection_id TEXT,
  last_heartbeat TEXT,
  joined_at TEXT NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby_id ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_user_id ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_game_id ON lobbies(game_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
