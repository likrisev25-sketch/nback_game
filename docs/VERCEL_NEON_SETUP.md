# Настройка Vercel + Neon PostgreSQL для N-Back Game

## 🎯 Цель

Переключить проект с SQLite на PostgreSQL (Neon) для работы на Vercel (serverless).

## 📋 Шаги настройки

### 1. Создайте базу данных на Neon

1. Перейдите на https://console.neon.tech/
2. Войдите или зарегистрируйтесь (бесплатно)
3. Создайте новый проект:
   - Нажмите "New Project"
   - Выберите регион (например, US East)
   - Назовите проект `nback-game`
   - Нажмите "Create Project"
4. После создания скопируйте **Connection string**
   - Найдите в Dashboard: **Connection Details**
   - Скопируйте строку вида:
     ```
     postgresql://npg_WVoZfjHMy51c@ep-calm-water-aq758lpd-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```

### 2. Настройте переменные окружения в Vercel

1. Перейдите на: https://vercel.com/likrisev25-sketchs-projects/nback-game/settings/environment
2. Добавьте следующие переменные для всех окружений (Production, Preview, Development):

#### Переменная 1: DATABASE_URL
```
postgresql://npg_WVoZfjHMy51c@ep-calm-water-aq758lpd-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```
*(замените на ваш реальный connection string из шага 1)*

#### Переменная 2: BETTER_AUTH_SECRET
```
ваш-секрет-минимум-32-символа-случайная-строка
```

**Как сгенерировать секрет:**
```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Или используйте: https://generate-secret.vercel.app/32
```

#### Переменная 3: NEXT_PUBLIC_APP_URL
```
https://nback-game-topaz.vercel.app
```

#### Переменная 4: BETTER_AUTH_URL
```
https://nback-game-topaz.vercel.app
```

### 3. Примените миграции к базе данных

**Вариант A - Через Neon Dashboard (проще):**

1. В панели Neon откройте **SQL Editor** (или SQL Shell)
2. Скопируйте содержимое файла `drizzle/0000_unusual_prima.sql`
3. Вставьте SQL в редактор и выполните (Run)

**Вариант B - Через Drizzle Push (нужен локальный DATABASE_URL):**

1. Временно добавьте `DATABASE_URL` в ваш локальный `.env.local`
2. Запустите:
   ```bash
   npm run db:push
   ```

### 4. Переразверните приложение на Vercel

1. Перейдите на: https://vercel.com/likrisev25-sketchs-projects/nback-game
2. Нажмите **Redeploy** или запустите:
   ```bash
   vercel --prod
   ```

### 5. Проверьте работу

1. Откройте https://nback-game-topaz.vercel.app
2. Попробуйте зарегистрироваться
3. Попробуйте создать лобби
4. Проверьте, что данные сохраняются в базе данных

## 🔧 Локальная разработка

Для локальной разработки используйте тот же DATABASE_URL из Neon:

```bash
# .env.local
DATABASE_URL=postgresql://npg_WVoZfjHMy51c@ep-calm-water-aq758lpd-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=ваш-секрет
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Теперь локальная и продакшн версии используют одну базу данных!

## 📊 Работа с базой данных

### Просмотр данных через Drizzle Studio

```bash
npm run db:studio
```

Откроется веб-интерфейс для просмотра и редактирования данных в Neon.

### Создание новых миграций

```bash
# Сгенерировать миграцию
npm run db:generate

# Применить миграцию
npm run db:push
```

## 🚨 Решение проблем

### Ошибка: connection refused
- Проверьте, что DATABASE_URL правильный
- Убедитесь, что SSL включён (`?sslmode=require`)
- Проверьте, что проект Neon активен

### Ошибка: table does not exist
- Примените миграции через Neon SQL Editor
- Проверьте, что все таблицы созданы

### Ошибка: better-auth secret not set
- Добавьте BETTER_AUTH_SECRET в Vercel
- Длина должна быть минимум 32 символа

## 📝 Примечания

### Почему PostgreSQL вместо SQLite?

- **SQLite не работает на Vercel** — Vercel это serverless платформа, нет файловой системы
- **PostgreSQL (Neon)** — облачная база данных, идеально подходит для serverless
- **Бесплатно** — Neon предоставляет 0.5 GB бесплатно

### Преимущества Neon

- ✅ Serverless PostgreSQL
- ✅ Бесплатный план (0.5 GB)
- ✅ Автоматическое масштабирование
- ✅ Поддержка SSL
- ✅ Отличная производительность

## 🎉 Готово!

После настройки ваш проект будет работать на Vercel с PostgreSQL!

---

**Дата:** 16.05.2026
**Версия:** 0.3.0