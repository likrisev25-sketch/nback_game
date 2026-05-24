# Настройка базы данных для Vercel + Neon

## Проблема
Таблицы не созданы в базе данных PostgreSQL, что вызывает ошибку 500 при создании лобби.

## Решение

### Вариант 1: Использовать готовый скрипт (рекомендуется)

1. **Проверь, что `DATABASE_URL` настроена на Vercel:**
   - Зайди в [Vercel Dashboard](https://vercel.com/dashboard)
   - Выбери проект `nback-game`
   - Перейди в **Settings** → **Environment Variables**
   - Убедись, что есть переменная `DATABASE_URL` с подключением к Neon PostgreSQL

2. **Запусти скрипт создания таблиц локально:**
   ```bash
   # Установи зависимости
   npm install
   
   # Скопируй переменные окружения с Vercel (опционально)
   vercel env pull
   
   # Создай таблицы
   npm run db:create-tables
   ```

3. **Или проверь состояние БД:**
   ```bash
   npm run db:check
   ```

### Вариант 2: Использовать Drizzle Kit

```bash
# Сгенерируй миграции
npm run db:generate

# Применяй миграции к продакшен БД
npx drizzle-kit push --dialect postgresql
```

### Вариант 3: Ручное создание таблиц через SQL

Подключись к Neon через SQL Editor и выполни:

```sql
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
);

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
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS sequences (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  positions TEXT NOT NULL,
  total_steps INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_move_idx ON game_moves(session_id, player_id, step_number);
```

## После создания таблиц

1. **Сделай новый деплой на Vercel:**
   ```bash
   git add .
   git commit -m "Add database setup scripts"
   git push
   ```

2. **Проверь работу:**
   - Открой приложение в браузере
   - Попробуй создать лобби
   - Если всё работает - отлично!

## Проверка

Запусти команду проверки:
```bash
npm run db:check
```

Ожидаемый вывод:
```
✅ Connection successful!
✅ All tables exist!
✅ Database is ready to use!
```

## Если всё ещё не работает

1. Проверь **Vercel Function Logs** - там будут детальные ошибки
2. Убедись, что `DATABASE_URL` начинается с `postgresql://` и содержит данные Neon
3. Проверь, что таблицы действительно созданы в Neon Dashboard → SQL Editor
