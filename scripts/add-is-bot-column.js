import { db } from '../db/db.js';
import { neon } from '@neondatabase/serverless';

async function addIsBotColumn() {
  console.log('🔵 Adding is_bot column to lobby_players...');
  
  try {
    // Используем drizzle ORM для добавления колонки
    await db.execute(`
      ALTER TABLE lobby_players 
      ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✅ is_bot column added successfully!');
  } catch (error) {
    console.error('❌ Error adding is_bot column:', error);
    process.exit(1);
  }
}

addIsBotColumn();
