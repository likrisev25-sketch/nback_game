# Быстрый деплой на Vercel + Neon (5 минут)

## ⚡ Шаг 1: Создайте базу данных на Neon (2 минуты)

1. Перейдите на https://console.neon.tech/
2. Нажмите **"New Project"**
3. Выберите регион и нажмите **"Create Project"**
4. Скопируйте **Connection string** из раздела "Connection Details"

## ⚡ Шаг 2: Настройте переменные окружения в Vercel (2 минуты)

1. Перейдите на https://vercel.com/likrisev25-sketchs-projects/nback-game/settings/environment
2. Добавьте переменные:

```
DATABASE_URL=postgresql://ваш-connection-string-из-шага-1
BETTER_AUTH_SECRET=случайная-строка-минимум-32-символа
NEXT_PUBLIC_APP_URL=https://nback-game-topaz.vercel.app
BETTER_AUTH_URL=https://nback-game-topaz.vercel.app
```

postgresql://neondb_owner:npg_TriPGu7Vk0nf@ep-square-base-aqoir521-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require




**Сгенерировать секрет:** https://generate-secret.vercel.app/32

## ⚡ Шаг 3: Примените миграции к базе данных (1 минута)

1. В панели Neon откройте **SQL Editor**
2. Скопируйте SQL из файла `drizzle/0000_unusual_prima.sql`
3. Вставьте и выполните (Run)

## ⚡ Шаг 4: Переразверните приложение (30 секунд)

1. Перейдите на https://vercel.com/likrisev25-sketchs-projects/nback-game
2. Нажмите **"Redeploy"**

## ✅ Готово!

Откройте https://nback-game-topaz.vercel.app и проверьте:
- ✅ Регистрация работает
- ✅ Создание лобби работает
- ✅ Данные сохраняются

---

**Если есть вопросы:** см. полную документацию в `docs/VERCEL_NEON_SETUP.md`