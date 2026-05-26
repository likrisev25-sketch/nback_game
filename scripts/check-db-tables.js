// Скрипт для проверки существования таблиц в базе данных
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function checkTables() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔵 Connecting to database...');
  
  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    ssl: { rejectUnauthorized: false },
  });
  
  const db = drizzle(client);

  try {
    console.log('🔵 Checking tables...');
    
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('✅ Found tables:', tables.rows.map(r => r.table_name).join(', '));
    
    const requiredTables = ['lobbies', 'lobby_players', 'tournaments', 'tournament_players', 'tournament_results', 'game_sessions', 'game_players'];
    const foundTables = tables.rows.map(r => r.table_name);
    
    const missingTables = requiredTables.filter(t => !foundTables.includes(t));
    
    if (missingTables.length > 0) {
      console.error('❌ Missing tables:', missingTables.join(', '));
      console.log('\n💡 Run: npm run db:push or npm run db:migrate');
    } else {
      console.log('✅ All required tables exist!');
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    console.error(error.stack);
  } finally {
    await client.end();
  }
}

checkTables();
