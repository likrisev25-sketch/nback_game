import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function check() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔵 Connecting to database...');
  const client = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(client);

  try {
    // Проверяем существование таблицы game_sessions
    console.log('🔵 Checking game_sessions table...');
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('game_sessions', 'game_players')
    `);
    console.log('📋 Existing tables:', tables);

    // Проверяем структуру game_sessions
    console.log('🔵 Checking game_sessions structure...');
    const columns = await db.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'game_sessions'
    `);
    console.log('📋 game_sessions columns:', columns);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

check();
