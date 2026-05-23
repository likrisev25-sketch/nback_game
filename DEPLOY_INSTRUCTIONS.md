# 🚀 Инструкция по деплою на Vercel

## Быстрый старт

### 1. Установка таблиц в БД

**Вариант A: Через Neon Dashboard (самый простой)**

1. Откройте https://neon.tech
2. Выберите свой проект (из `.env` - DATABASE_URL)
3. Откройте **SQL Editor**
4. Скопируйте содержимое `drizzle/0001_lobby_and_tournament_tables.sql`
5. Нажмите **Run**

**Вариант B: Через команду**

```bash
# Установите Vercel CLI
npm i -g vercel

# Login и link
vercel login
vercel link

# Скачать env variables
vercel env pull

# Запустить миграции
npx drizzle-kit push
```

### 2. Деплой на Vercel

```bash
# Деплой
vercel --prod
```

Или через веб-интерфейс:
1. https://vercel.com/new
2. Import your Git repository
3. Deploy

### 3. Проверка

Откройте https://your-app.vercel.app и:
1. Зарегистрируйтесь
2. Перейдите на `/play`
3. Начните игру с ботом

## ⚠️ Важные замечания

### WebSocket не работает на Vercel!

**Почему:** Vercel использует Serverless функции которые не поддерживают постоянные соединения.

**Что работает:**
- ✅ Игра с ботом (`/play`)
- ✅ Регистрация/авторизация
- ✅ База данных (Neon PostgreSQL)

**Что не работает:**
- ❌ WebSocket real-time обновление
- ❌ Многопользовательская игра через WebSocket

**Решения для многопользовательской игры:**

#### Решение 1: Использовать игру с ботом
Просто используйте `/play` - это полностью рабочая игра

#### Решение 2: Сторонний real-time сервис
- **Pusher**: https://pusher.com
- **Ably**: https://www.ably.com
- **Socket.io with Redis**: Self-hosted

#### Решение 3: Polling вместо WebSocket
Обновлять данные каждые X секунд через API

## 📋 Проверенные функции

| Функция | Статус | Примечание |
|---------|--------|------------|
| Игра с ботом | ✅ Работает | `/play` |
| Регистрация | ✅ Работает | База данных Neon |
| Авторизация | ✅ Работает | Sessions в БД |
| Главная страница | ✅ Работает | |
| Лобби | ⚠️ Без real-time | Нужно polling |
| Турниры | ⚠️ Без real-time | Нужно polling |

## 🔧 Troubleshooting

### Ошибка: DATABASE_URL не установлен
```bash
# Добавьте в Vercel Environment Variables
vercel env add DATABASE_URL production
```

### Ошибка: Таблицы не созданы
```bash
# Выполните через Neon Dashboard SQL Editor
# Или локально:
vercel env pull
npx drizzle-kit push
```

### Ошибка: better-sqlite3 not found
```bash
# Удалите и переустановите зависимости
rm -rf node_modules package-lock.json
npm install
```

### Ошибка: Build failed
Проверьте что:
1. `DATABASE_URL` установлен в Vercel
2. `BETTER_AUTH_SECRET` установлен
3. Нет ошибок в консоли при `npm run build`

## 🎉 Готово!

После успешного деплоя:
- Откройте https://your-app.vercel.app
- Играйте в `/play`
- Наслаждайтесь! 🎮

## 📞 Поддержка

Если что-то не работает:
1. Проверьте логи: `vercel logs`
2. Проверьте Environment Variables
3. Проверьте что таблицы созданы в Neon
4. Откройте issue на GitHub
