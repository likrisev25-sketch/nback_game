const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function checkTables() {
  const sql = postgres(process.env.DATABASE_URL, { 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('🔵 Checking lobby tables...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('lobbies', 'lobby_players')
    `;
    
    console.log('📊 Tables found:', tables);
    
    if (tables.length === 0) {
      console.error('❌ No lobby tables found!');
      return;
    }
    
    const cols = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('lobbies', 'lobby_players')
      ORDER BY table_name, ordinal_position
    `;
    
    console.log('📋 Columns:');
    cols.forEach(c => {
      console.log(`  ${c.table_name}.${c.column_name}: ${c.data_type} (${c.is_nullable})`);
    });
    
    console.log('\n✅ Tables structure check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();
