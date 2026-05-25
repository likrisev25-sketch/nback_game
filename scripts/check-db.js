const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Fallback to .env

async function checkDatabase() {
  console.log('🔵 Checking database connection...');
  console.log('🔵 DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL is not set!');
    console.error('Please add DATABASE_URL to your Vercel environment variables.');
    process.exit(1);
  }
  
  console.log('🔵 DATABASE_URL starts with postgres:', process.env.DATABASE_URL.startsWith('postgres'));
  
  const client = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
  });
  
  const db = drizzle(client);
  
  try {
    console.log('🔵 Testing connection...');
    const result = await client`SELECT 1 as test`;
    console.log('✅ Connection successful!');
    console.log('🔵 Result:', result);
    
    console.log('🔵 Checking if lobbies table exists...');
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('lobbies', 'lobby_players', 'game_sessions', 'game_players')
    `;
    
    console.log('🔵 Found tables:', tables);
    
    if (tables.length === 0) {
      console.error('❌ ERROR: No tables found! You need to run migrations.');
      console.error('Run: npx drizzle-kit push');
      process.exit(1);
    }
    
    console.log('✅ All tables exist!');
    
    // Проверяем lobbies
    const lobbyCount = await client`SELECT COUNT(*) as count FROM lobbies`;
    console.log('🔵 Lobbies count:', lobbyCount[0].count);
    
    // Проверяем lobby_players
    const playerCount = await client`SELECT COUNT(*) as count FROM lobby_players`;
    console.log('🔵 Lobby players count:', playerCount[0].count);
    
    console.log('✅ Database is ready to use!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.message.includes('relation') || error.message.includes('table')) {
      console.error('❌ Tables do not exist. Run migrations: npx drizzle-kit push');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkDatabase();
