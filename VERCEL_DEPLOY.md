# 🚀 Деплой на Vercel

## ✅ Что уже настроено

- [x] База данных Neon PostgreSQL
- [x] Environment variables в `.env`
- [x] Убран better-sqlite3 (не работает на Vercel)
- [x] API routes совместимы с Serverless

## 📋 Шаг 1: Установка таблиц в БД

### Вариант A: Через Vercel CLI (рекомендуется)
```bash
# Установите Vercel CLI
npm i -g vercel

# Login
vercel login

# Link проект
vercel link

# Запустить миграции
vercel env pull  # Скачать env variables
npx drizzle-kit push
```

### Вариант B: Через Neon Dashboard
1. Откройте https://neon.tech
2. Выберите свой проект
3. Откройте SQL Editor
4. Выполните SQL из `drizzle/0001_lobby_and_tournament_tables.sql`

### Вариант C: Через локальную команду
```bash
# Скопируйте DATABASE_URL из .env
export DATABASE_URL="your-neon-url"

# Запустите миграции
npx drizzle-kit push
```

## 📋 Шаг 2: Настройка Vercel

### 2.1 Подключите проект на Vercel
```bash
vercel
```

Или через веб-интерфейс:
1. https://vercel.com/new
2. Import Git repository
3. Configure project

### 2.2 Добавьте Environment Variables
В настройках Vercel (Settings → Environment Variables):

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2.3 Настройте Build Settings
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: `.next`

## 📋 Шаг 3: Deploy

```bash
vercel --prod
```

## 🔧 Решение проблем

### Ошибка: "DATABASE_URL is not set"
```bash
# Проверьте что переменная есть в Vercel
vercel env ls

# Добавьте если нет
vercel env add DATABASE_URL production
```

### Ошибка: Таблицы не созданы
```bash
# Запустите миграции локально с Vercel env
vercel env pull
npx drizzle-kit push
```

Или через Neon Dashboard → SQL Editor выполните:
```sql
-- Из drizzle/0001_lobby_and_tournament_tables.sql
```

### Ошибка: WebSocket не работает
**WebSocket не поддерживается на Vercel Serverless!**

**Решения:**
1. **Используйте игру с ботом** (`/play`) - работает отлично
2. **Используйте сторонний сервис** (Pusher, Ably) для real-time
3. **Polling вместо WebSocket** - обновляйте данные каждые X секунд

### Ошибка: better-sqlite3 не найдён
```bash
# Удалите node_modules и reinstall
rm -rf node_modules package-lock.json
npm install

# Убедитесь что better-sqlite3 удалён из package.json
```

## 🎯 Что работает на Vercel

✅ **Полностью работает:**
- Главная страница
- Игра с ботом (`/play`)
- Регистрация/авторизация
- База данных (Neon PostgreSQL)

⚠️ **Частично работает:**
- Лобби (без WebSocket - нужно использовать polling)
- Турниры (без WebSocket - нужно использовать polling)

❌ **Не работает:**
- WebSocket (не поддерживается на Vercel)

## 🔄 Альтернатива для WebSocket

Если нужны real-time функции (многопользовательская игра):

### Вариант 1: Pusher
```bash
npm install pusher pusher-js
```

### Вариант 2: Ably
```bash
npm install ably
```

### Вариант 3: Self-hosted сервер
Запустите отдельный сервер на Railway/Render для WebSocket

## 📊 Мониторинг

### Логи Vercel
```bash
vercel logs
```

### Логи функций
Проверьте в Vercel Dashboard → Functions → Logs

## ✅ Проверка деплоя

1. Откройте https://your-app.vercel.app
2. Зарегистрируйтесь
3. Перейдите на `/play`
4. Начните игру с ботом

Если всё работает - ✅ Деплой успешен!

## 🎉 Готово!

Ваше приложение теперь работает на Vercel!

Для многопользовательской игры используйте сторонний real-time сервис.
