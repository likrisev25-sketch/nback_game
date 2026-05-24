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
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(sql);

  try {
    // Проверяем существование таблицы lobbies
    console.log('🔵 Checking lobbies table...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'lobbies'
    `;
    console.log('lobbies table exists:', tables);

    // Проверяем структуру lobbies
    console.log('🔵 Checking lobbies structure...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'lobbies'
      ORDER BY ordinal_position
    `;
    console.log('lobbies columns:', columns);

    // Проверяем lobby_players
    console.log('🔵 Checking lobby_players columns...');
    const playerColumns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'lobby_players'
      ORDER BY ordinal_position
    `;
    console.log('lobby_players columns:', playerColumns);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

check();
