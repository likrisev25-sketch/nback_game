# Деплой на Vercel

## 1. Настройка переменных окружения

После деплоя нужно добавить переменные окружения в панели управления Vercel:

1. Перейдите на https://vercel.com/dashboard
2. Откройте проект `nback-game`
3. Перейдите в **Settings** → **Environment Variables**
4. Добавьте следующие переменные для **Production**, **Preview** и **Development**:

### Обязательные переменные:

```
NEXT_PUBLIC_APP_URL=https://nback-game-kqcbsnkdi-likrisev25-sketchs-projects.vercel.app
BETTER_AUTH_URL=https://nback-game-kqcbsnkdi-likrisev25-sketchs-projects.vercel.app
BETTER_AUTH_SECRET=<сгенерируйте случайную строку минимум 32 символа>
DATABASE_URL=file:./db.sqlite
```

### Как сгенерировать BETTER_AUTH_SECRET:

```bash
# На Linux/Mac
openssl rand -base64 32

# На Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Или просто используйте любую случайную строку из 32+ символов.

## 2. База данных

⚠️ **Важно!** Vercel не поддерживает SQLite в продакшене. Вам нужно:

### Вариант A: Использовать Vercel Postgres (рекомендуется)

1. Создайте базу данных в Vercel Postgres
2. Обновите `DATABASE_URL` на PostgreSQL строку подключения
3. Обновите `db/db.ts` для использования PostgreSQL

### Вариант B: Использовать внешний PostgreSQL

Подключитесь к любой внешней PostgreSQL базе данных (Supabase, Neon, Railway и т.д.)

## 3. Запуск деплоя

После настройки переменных окружения:

```bash
# Деплой продакшена
vercel --prod
```

## 4. После деплоя

1. **Создайте таблицы в базе данных:**
   ```bash
   npm run db:push
   ```
   
2. **Проверьте логи:**
   - Перейдите в **Deployments** в панели Vercel
   - Проверьте, что нет ошибок

3. **Протестируйте приложение:**
   - Откройте URL вашего приложения
   - Зарегистрируйтесь
   - Создайте лобби/турнир

## 5. Проблемы и решения

### Проблема: Socket.IO не работает

Vercel Serverless не поддерживает долгие WebSocket подключения. Для полноценного WebSocket вам нужно:

**Вариант A:** Использовать внешний Socket.IO сервер (например, на Railway, Render или Heroku)

**Вариант B:** Использовать Vercel Edge Functions с WebSocket поддержкой (ограниченная поддержка)

**Вариант C:** Использовать альтернативы:
- Pusher
- Ably
- Liveblocks
- Supabase Realtime

### Проблема: База данных не сохраняется

SQLite на Vercel не сохраняет данные между запросами. Обязательно используйте PostgreSQL!

## 6. Автоматический деплой из Git

Для автоматического деплоя при каждом коммите:

1. Подключите Git репозиторий в Vercel
2. Настройте webhook
3. Каждый push в main будет автоматически деплоиться

Команда для подключения Git:
```bash
vercel link
```

## 7. Кастомный домен (опционально)

В панели Vercel:
1. **Settings** → **Domains**
2. Добавьте ваш домен
3. Настройте DNS записи

---

**Ваш URL приложения:** https://nback-game-kqcbsnkdi-likrisev25-sketchs-projects.vercel.app
