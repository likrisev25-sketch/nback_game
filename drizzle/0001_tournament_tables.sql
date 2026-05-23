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
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TEXT NOT NULL,
  UNIQUE(tournament_id, user_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournament_id ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_user_id ON tournament_players(user_id);
