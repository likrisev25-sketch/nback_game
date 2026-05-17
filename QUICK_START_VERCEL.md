# ✅ Приложение развёрнуто на Vercel!

## Ваш URL:
**https://nback-game-topaz.vercel.app**

## 🚀 Следующие шаги:

### 1. Настройте переменные окружения

Перейдите в панель Vercel:
https://vercel.com/likrisev25-sketchs-projects/nback-game/settings/environment

Добавьте эти переменные для **Production**, **Preview** и **Development**:

```
NEXT_PUBLIC_APP_URL=https://nback-game-topaz.vercel.app
BETTER_AUTH_URL=https://nback-game-topaz.vercel.app
BETTER_AUTH_SECRET=сгенерируйте_случайную_строку_32_символа
```

**Как сгенерировать секрет:**   70bf6f811a38bb72cb84f0948f82a9dd
- https://generate-secret.vercel.app/32
- Или: `openssl rand -base64 32` (Linux/Mac)
- Или любой случайный набор из 32+ символов

### 2. Настройте базу данных (ОБЯЗАТЕЛЬНО!)

SQLite на Vercel не сохраняет данные! Выберите вариант:

**Вариант A - Vercel Postgres (рекомендуется):**
1. В панели Vercel: **Storage** → **Create Database** → **Postgres**
2. Скопируйте `DATABASE_URL`
3. Добавьте как переменную окружения

**Вариант B - Supabase (бесплатно):**
1. https://supabase.com/dashboard
2. Создайте новый проект
3. Скопируйте `connection string` → `postgresql://...`
4. Добавьте как `DATABASE_URL` в Vercel

**Вариант C - Neon (бесплатно):**
1. https://neon.tech
2. Создайте проект
3. Скопируйте connection string
4. Добавьте как `DATABASE_URL` в Vercel

### 3. Примените миграции базы данных

После настройки PostgreSQL выполните:
```bash
npm run db:push
```

Или через Vercel CLI:
```bash
vercel env pull  # скачать переменные окружения
npm run db:push  # создать таблицы
```

### 4. Перераспределите приложение

После настройки переменных:
```bash
vercel --prod
```

Или просто нажмите **Redeploy** в панели Vercel на последней деплоймент.

## 🎮 Как использовать:

1. Откройте https://nback-game-topaz.vercel.app
2. Зарегистрируйтесь или войдите
3. Создайте лобби или турнир
4. Пригласите друзей по ссылке!

## 📝 Примечания:

- **WebSocket/Socket.IO**: На Vercel Serverless WebSocket имеет ограничения. Для полноценного мультиплеера рассмотрите:
  - Внешний Socket.IO сервер (Railway, Render)
  - Альтернативы: Pusher, Ably, Liveblocks, Supabase Realtime
  
- **База данных**: Обязательно используйте PostgreSQL для сохранения данных пользователей и игр

## 🔗 Полезные ссылки:

- Панель Vercel: https://vercel.com/likrisev25-sketchs-projects/nback-game
- Логи деплоя: https://vercel.com/likrisev25-sketchs-projects/nback-game/deployments
- Документация: ./VERCEL_DEPLOYMENT.md

---

Нужна помощь? Создайте issue в репозитории или обратитесь в поддержку Vercel.
