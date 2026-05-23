import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Please set it in your .env file.');
  console.log('   Current env variables:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DATABASE_URL')));
  process.exit(1);
}

async function runMigrations() {
  console.log('🔵 Connecting to database...');
  const sql = neon(DATABASE_URL);
  
  try {
    // Проверяем подключение
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Читаем SQL файл
    const sqlFile = path.join(__dirname, '..', 'drizzle', '0001_lobby_and_tournament_tables.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('📦 Running migrations...');
    
    // Выполняем SQL команды
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim().length > 0) {
        try {
          await sql(command);
          const firstLine = command.split('\n')[0].substring(0, 60);
          console.log(`✅ Executed: ${firstLine}...`);
        } catch (error) {
          // Игнорируем ошибки если таблица уже существует
          if (error.message && error.message.includes('already exists')) {
            console.log(`⚠️  Already exists: ${firstLine}...`);
          } else {
            console.error(`❌ Error executing: ${firstLine}...`, error.message);
          }
        }
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
    // Проверяем созданные таблицы
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log('\n📋 Created/updated tables:');
    tables.forEach((row) => console.log(`   - ${row.tablename}`));
    
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  }
}

runMigrations();
