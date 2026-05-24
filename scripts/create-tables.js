const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

async function createTables() {
  console.log('🔵 Creating tables in database...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is not set!');
    console.error('Please add DATABASE_URL to your environment variables.');
    console.error('Example: postgres://user:password@host:5432/database');
    process.exit(1);
  }
  
  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });
  
  const db = drizzle(client);
  
  try {
    console.log('🔵 Testing connection...');
    await client`SELECT 1`;
    console.log('✅ Connection successful!');
    
    // Создаём таблицы lobbies и lobby_players
    console.log('🔵 Creating lobbies table...');
    await client`
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
      )
    `;
    console.log('✅ lobbies table created');
    
    console.log('🔵 Creating lobby_players table...');
    await client`
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
      )
    `;
    console.log('✅ lobby_players table created');
    
    // Создаём таблицы для game sessions если их нет
    console.log('🔵 Creating game_sessions table...');
    await client`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        n_value INTEGER NOT NULL,
        base_speed_ms INTEGER NOT NULL,
        current_speed_ms INTEGER NOT NULL,
        max_players INTEGER NOT NULL DEFAULT 2,
        status TEXT NOT NULL DEFAULT 'waiting',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;
    console.log('✅ game_sessions table created');
    
    console.log('🔵 Creating game_players table...');
    await client`
      CREATE TABLE IF NOT EXISTS game_players (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'Player',
        correct_answers INTEGER NOT NULL DEFAULT 0,
        errors INTEGER NOT NULL DEFAULT 0,
        is_bot BOOLEAN NOT NULL DEFAULT false,
        bot_accuracy INTEGER NOT NULL DEFAULT 100,
        is_host BOOLEAN NOT NULL DEFAULT false,
        joined_at TEXT NOT NULL
      )
    `;
    console.log('✅ game_players table created');
    
    console.log('🔵 Creating game_moves table...');
    await client`
      CREATE TABLE IF NOT EXISTS game_moves (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        player_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        step_number INTEGER NOT NULL,
        is_match BOOLEAN NOT NULL,
        player_answer BOOLEAN,
        is_correct BOOLEAN,
        created_at TEXT NOT NULL
      )
    `;
    console.log('✅ game_moves table created');
    
    console.log('🔵 Creating sequences table...');
    await client`
      CREATE TABLE IF NOT EXISTS sequences (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
        positions TEXT NOT NULL,
        total_steps INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `;
    console.log('✅ sequences table created');
    
    // Создаём индекс для game_moves
    console.log('🔵 Creating index on game_moves...');
    await client`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_move_idx 
      ON game_moves(session_id, player_id, step_number)
    `;
    console.log('✅ Index created');
    
    console.log('✅ All tables created successfully!');
    
    // Проверяем, что таблицы существуют
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('lobbies', 'lobby_players', 'game_sessions', 'game_players', 'game_moves', 'sequences')
    `;
    
    console.log('🔵 Final table list:', tables.map(t => t.table_name).join(', '));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

createTables();
