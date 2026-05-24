import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔵 Connecting to database...');
  const client = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(client);

  console.log('🔵 Adding is_bot column to lobby_players...');
  try {
    await db.execute(`
      ALTER TABLE lobby_players 
      ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✅ is_bot column added successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
