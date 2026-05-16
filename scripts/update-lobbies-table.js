const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.sqlite');
const db = new Database(dbPath);

console.log('Updating lobbies table...');

try {
  // Проверяем есть ли колонки
  const columns = db.prepare("PRAGMA table_info(lobbies)").all();
  const columnNames = columns.map(c => c.name);
  
  console.log('Current columns:', columnNames.join(', '));
  
  // Если нет min_players или auto_start_enabled, пересоздаем таблицу
  if (!columnNames.includes('min_players') || !columnNames.includes('auto_start_enabled')) {
    console.log('Missing columns found. Recreating table...');
    
    // Сохраняем старые данные
    const oldData = db.prepare("SELECT * FROM lobbies").all();
    
    // Создаем новую таблицу
    db.exec(`
      DROP TABLE IF EXISTS lobbies;
      CREATE TABLE lobbies (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'waiting',
        n_value INTEGER NOT NULL DEFAULT 1,
        base_speed_ms INTEGER NOT NULL DEFAULT 2000,
        min_players INTEGER NOT NULL DEFAULT 2,
        max_players INTEGER NOT NULL DEFAULT 2,
        current_players INTEGER NOT NULL DEFAULT 0,
        host_id TEXT NOT NULL,
        password TEXT,
        auto_start_enabled INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        started_at TEXT,
        finished_at TEXT
      );
    `);
    
    // Вставляем старые данные (min_players и auto_start_enabled будут по умолчанию)
    for (const row of oldData) {
      db.prepare(`
        INSERT INTO lobbies (id, game_id, name, status, n_value, base_speed_ms, 
                            min_players, max_players, current_players, host_id, 
                            password, auto_start_enabled, created_at, started_at, finished_at)
        VALUES (?, ?, ?, ?, ?, ?, 2, ?, ?, ?, ?, 0, ?, ?, ?)
      `).run(
        row.id, row.game_id, row.name, row.status, row.n_value, row.base_speed_ms,
        row.max_players, row.current_players, row.host_id, row.password,
        row.created_at, row.started_at, row.finished_at
      );
    }
    
    console.log('✅ Table updated successfully!');
  } else {
    console.log('✅ All columns already exist!');
  }
  
  // Проверяем финальную структуру
  const finalColumns = db.prepare("PRAGMA table_info(lobbies)").all();
  console.log('Final columns:', finalColumns.map(c => c.name).join(', '));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
}
