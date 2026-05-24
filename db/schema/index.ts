import { pgTable, text, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Таблица пользователей
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Таблица сессий
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: text('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

// Таблица аккаунтов (для OAuth)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: text('access_token_expires_at'),
  refreshTokenExpiresAt: text('refresh_token_expires_at'),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Таблица верификации
export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Таблица игровых сессий
export const gameSessions = pgTable('game_sessions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nValue: integer('n_value').notNull(),
  baseSpeedMs: integer('base_speed_ms').notNull(),
  currentSpeedMs: integer('current_speed_ms').notNull(),
  maxPlayers: integer('max_players').notNull().default(2),
  status: text('status').notNull().default('waiting'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Таблица игроков в сессии
export const gamePlayers = pgTable('game_players', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().default('Player'),
  correctAnswers: integer('correct_answers').notNull().default(0),
  errors: integer('errors').notNull().default(0),
  isBot: boolean('is_bot').notNull().default(false),
  botAccuracy: integer('bot_accuracy').notNull().default(100),
  isHost: boolean('is_host').notNull().default(false),
  joinedAt: text('joined_at').notNull(),
});

// Relations
export const gameSessionsRelations = relations(gameSessions, ({ many }) => ({
  players: many(gamePlayers),
}));

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  session: one(gameSessions, {
    fields: [gamePlayers.sessionId],
    references: [gameSessions.id],
  }),
}));

// Таблица ходов игры
export const gameMoves = pgTable('game_moves', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => gameSessions.id, { onDelete: 'cascade' }),
  playerId: text('player_id').notNull(),
  position: integer('position').notNull(),
  stepNumber: integer('step_number').notNull(),
  isMatch: boolean('is_match').notNull(),
  playerAnswer: boolean('player_answer'),
  isCorrect: boolean('is_correct'),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  uniqueMoveIdx: uniqueIndex('unique_move_idx').on(table.sessionId, table.playerId, table.stepNumber),
}));

// Таблица последовательностей
export const sequences = pgTable('sequences', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => gameSessions.id, { onDelete: 'cascade' }),
  positions: text('positions').notNull(),
  totalSteps: integer('total_steps').notNull(),
  createdAt: text('created_at').notNull(),
});

// Таблица результатов турниров
export const tournamentResults = pgTable('tournament_results', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id').notNull(),
  playerId: text('player_id').notNull(),
  isBot: boolean('is_bot').notNull().default(false),
  botAccuracy: integer('bot_accuracy'),
  totalCorrect: integer('total_correct').notNull().default(0),
  totalErrors: integer('total_errors').notNull().default(0),
  roundWins: integer('round_wins').notNull().default(0),
  rank: integer('rank'),
  createdAt: text('created_at').notNull(),
});

// ============================================
// LOBBY TABLES (Multiplayer Lobby System)
// ============================================

// Таблица лобби
export const lobbies = pgTable('lobbies', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('waiting'),
  nValue: integer('n_value').notNull().default(2),
  baseSpeedMs: integer('base_speed_ms').notNull().default(2000),
  minPlayers: integer('min_players').notNull().default(2),
  maxPlayers: integer('max_players').notNull().default(2),
  currentPlayers: integer('current_players').notNull().default(0),
  hostId: text('host_id').notNull(),
  password: text('password'),
  autoStartEnabled: boolean('auto_start_enabled').notNull().default(false),
  createdAt: text('created_at').notNull(),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
});

// Таблица игроков в лобби
export const lobbyPlayers = pgTable('lobby_players', {
  id: text('id').primaryKey(),
  lobbyId: text('lobby_id')
    .notNull()
    .references(() => lobbies.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  isReady: boolean('is_ready').notNull().default(false),
  isHost: boolean('is_host').notNull().default(false),
  isBot: boolean('is_bot').notNull().default(false),
  botAccuracy: integer('bot_accuracy').notNull().default(100),
  connectionId: text('connection_id'),
  lastHeartbeat: text('last_heartbeat'),
  joinedAt: text('joined_at').notNull(),
}, (table) => ({
  uniquePlayerIdx: uniqueIndex('unique_lobby_player_idx').on(table.lobbyId, table.userId),
}));

// ============================================
// TOURNAMENT TABLES (Online Tournament System)
// ============================================

// Таблица турниров
export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nValue: integer('n_value').notNull().default(2),
  totalSteps: integer('total_steps').notNull().default(30),
  baseSpeedMs: integer('base_speed_ms').notNull().default(2000),
  maxRounds: integer('max_rounds').notNull().default(5),
  currentRound: integer('current_round').notNull().default(1),
  status: text('status').notNull().default('waiting'),
  minPlayers: integer('min_players').notNull().default(2),
  maxPlayers: integer('max_players').notNull().default(2),
  currentPlayers: integer('current_players').notNull().default(0),
  hostId: text('host_id').notNull(),
  password: text('password'),
  createdAt: text('created_at').notNull(),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
});

// Таблица игроков в турнире
export const tournamentPlayers = pgTable('tournament_players', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id')
    .notNull()
    .references(() => tournaments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  isReady: boolean('is_ready').notNull().default(false),
  isHost: boolean('is_host').notNull().default(false),
  joinedAt: text('joined_at').notNull(),
}, (table) => ({
  uniquePlayerIdx: uniqueIndex('unique_tournament_player_idx').on(table.tournamentId, table.userId),
}));
