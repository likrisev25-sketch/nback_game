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
    auto_start_enabled BOOLEAN NOT NULL DEFAULT false,
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
    is_ready BOOLEAN NOT NULL DEFAULT false,
    is_host BOOLEAN NOT NULL DEFAULT false,
    is_bot BOOLEAN NOT NULL DEFAULT false,
    bot_accuracy INTEGER NOT NULL DEFAULT 100,
    connection_id TEXT,
    last_heartbeat TEXT,
    joined_at TEXT NOT NULL,
    UNIQUE(lobby_id, user_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_lobby_players_lobbyId ON lobby_players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobby_players_userId ON lobby_players(user_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);

-- Таблица турниров
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    n_value INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL DEFAULT 30,
    base_speed_ms INTEGER NOT NULL DEFAULT 2000,
    max_rounds INTEGER NOT NULL DEFAULT 3,
    current_round INTEGER NOT NULL DEFAULT 0,
    min_players INTEGER NOT NULL DEFAULT 2,
    max_players INTEGER NOT NULL DEFAULT 4,
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
    connection_id TEXT,
    last_heartbeat TEXT,
    joined_at TEXT NOT NULL,
    total_correct INTEGER NOT NULL DEFAULT 0,
    total_errors INTEGER NOT NULL DEFAULT 0,
    best_round_correct INTEGER NOT NULL DEFAULT 0,
    UNIQUE(tournament_id, user_id)
);

-- Индексы для турниров
CREATE INDEX IF NOT EXISTS idx_tournament_players_tournamentId ON tournament_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_players_userId ON tournament_players(user_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
