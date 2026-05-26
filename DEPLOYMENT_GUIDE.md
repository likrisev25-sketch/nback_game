# 🚀 Полное руководство по деплою на Vercel с Neon PostgreSQL

## 📋 Предварительные требования

1. **GitHub аккаунт** — для хранения кода
2. **Vercel аккаунт** — для деплоя
3. **Neon аккаунt** — для базы данных (бесплатно)

## 🗄️ Шаг 1: Настройка базы данных Neon

1. **Зарегистрируйтесь на [neon.tech](https://neon.tech)**
2. **Создайте новый проект:**
   - Нажмите "Create a new project"
   - Введите имя (например, `nback-game`)
   - Выберите регион (ближайший к вам)
   - Нажмите "Create project"

3. **Получите connection string:**
   - В дашборде проекта нажмите "Connection Details"
   - Скопируйте **Pooler** connection string (начинается с `postgresql://`)
   - **ВАЖНО:** Для serverless (Vercel) используйте **прямой URL** (без `-pooler`):
     ```
     # Было (Pooler):
     postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
     
     # Стало (Direct):
     postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```

4. **Создайте таблицы в БД:**
   
   **Вариант A: Через Neon SQL Editor (рекомендуется)**
   ```bash
   # В Neon Dashboard откройте SQL Editor и выполните:
   ```
   
   Скопируйте SQL из файла `drizzle/0001_lobby_and_tournament_tables.sql`

   **Вариант B: Локально через drizzle-kit**
   ```bash
   # Установите Vercel CLI
   npm i -g vercel
   
   # Login в Vercel
   vercel login
   
   # Link проект
   vercel link
   
   # Скачайте env переменные
   vercel env pull
   
   # Запустите миграции
   npx drizzle-kit push
   ```

## 🔧 Шаг 2: Настройка переменных окружения

### Локально (для разработки)

1. **Скопируйте `.env.example` в `.env.local`:**
   ```bash
   cp .env.example .env.local
   ```

2. **Отредактируйте `.env.local`:**
   ```env
   DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   BETTER_AUTH_SECRET=<сгенерируйте: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### На Vercel (для продакшена)

1. **Откройте Vercel Dashboard**
2. **Перейдите в Settings → Environment Variables**
3. **Добавьте переменные:**

   ```
   DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   - Environment: Production ✅
   - Preview: ❌

   ```
   BETTER_AUTH_SECRET=<ваш-секрет-минимум-32-символа>
   ```
   - Environment: Production ✅
   - Preview: ❌

   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
   - Environment: Production ✅
   - Preview: ✅

## 🚀 Шаг 3: Деплой на Vercel

### Вариант 1: Через GitHub (рекомендуется)

1. **Запушите код на GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit with fixes"
   git push origin main
   ```

2. **Подключите репозиторий к Vercel:**
   - Зайдите на [vercel.com/new](https://vercel.com/new)
   - Нажмите "Import Git Repository"
   - Выберите ваш репозиторий `nback-game`
   - Нажмите "Import"

3. **Настройте проект:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (оставьте по умолчанию)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

4. **Добавьте переменные окружения:**
   - Нажмите "Environment Variables"
   - Добавьте `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`

5. **Нажмите "Deploy"**

### Вариант 2: Через Vercel CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Login
vercel login

# Деплой
vercel --prod
```

## ✅ Шаг 4: Проверка деплоя

### 1. Проверьте логи деплоя
- В Vercel Dashboard перейдите в "Deployments"
- Нажмите на последний деплой
- Проверьте "Logs" — не должно быть ошибок

### 2. Проверьте базу данных
- Откройте Neon Dashboard
- Перейдите в "Tables"
- Убедитесь, что все таблицы созданы:
  - `users`
  - `sessions`
  - `game_sessions`
  - `game_players`
  - `lobbies`
  - `lobby_players`
  - `tournaments`
  - `tournament_players`

### 3. Протестируйте приложение

**A. Проверка загрузки:**
- Откройте `https://your-app.vercel.app`
- Страница должна загрузиться за 2-5 секунд

**B. Проверка создания лобби:**
1. Зарегистрируйтесь или войдите как гость
2. Перейдите на `/lobbies`
3. Создайте новое лобби
4. Должно успешно создаться

**C. Проверка многопользовательской игры:**
1. Создайте лобби
2. Скопируйте ссылку
3. Откройте в другом браузере/вкладке
4. Присоединитесь к лобби
5. Оба игрока должны видеть друг друга

## 🔍 Устранение проблем

### Проблема: "DATABASE_URL is not set"

**Решение:**
1. Проверьте, что переменная добавлена в Vercel Dashboard
2. Перезадеплойте проект:
   ```bash
   vercel --prod
   ```

### Проблема: "Connection timeout"

**Решение:**
1. Уберите `-pooler` из DATABASE_URL
2. Убедитесь, что `sslmode=require` присутствует
3. Проверьте, что Neon проект активен

### Проблема: "Лобби не создаётся"

**Решение:**
1. Проверьте логи Vercel:
   ```bash
   vercel logs
   ```
2. Убедитесь, что таблицы созданы в БД
3. Проверьте, что `BETTER_AUTH_SECRET` >= 32 символа

### Проблема: "Session not working"

**Решение:**
1. Убедитесь, что используется HTTPS (Vercel автоматически)
2. Проверьте `NEXT_PUBLIC_APP_URL` — должен совпадать с доменом
3. Очистите куки браузера

### Проблема: "Медленная загрузка"

**Решение:**
1. Проверьте регион Neon — должен быть близок к вашей аудитории
2. Включите кэширование в Vercel (уже настроено в `vercel.json`)
3. Проверьте логи на наличие ошибок БД

## 📊 Мониторинг

### Vercel Analytics
- В Vercel Dashboard перейдите в "Analytics"
- Следите за:
  - Vitals (скорость загрузки)
  - Errors (ошибки)

### Neon Monitoring
- В Neon Dashboard перейдите в "Insights"
- Следите за:
  - Compute usage
  - Active connections

### Логи
```bash
# Просмотр логов Vercel
vercel logs <deployment-url>

# Логи в реальном времени
vercel logs --follow
```

## 🔄 Обновление приложения

После внесения изменений:

```bash
# 1. Закоммитьте изменения
git add .
git commit -m "Fixed lobby creation"

# 2. Запушите на GitHub
git push origin main

# 3. Vercel автоматически задеплоит
# Проверьте статус в Vercel Dashboard
```

## 📝 Чек-лист успешного деплоя

- [ ] Neon проект создан и таблицы настроены
- [ ] Переменные окружения добавлены в Vercel
- [ ] Проект задеплоен на Vercel
- [ ] Приложение загружается за < 5 секунд
- [ ] Можно создать лобби
- [ ] Можно присоединиться к лобби
- [ ] Многопользовательская игра работает
- [ ] Нет ошибок в логах Vercel
- [ ] База данных подключена и работает

## 🆘 Поддержка

Если возникли проблемы:

1. **Проверьте документацию:**
   - [Vercel Docs](https://vercel.com/docs)
   - [Neon Docs](https://neon.tech/docs)
   - [Next.js Docs](https://nextjs.org/docs)

2. **Посмотрите логи:**
   ```bash
   vercel logs
   ```

3. **Проверьте базу данных:**
   - Откройте Neon Dashboard
   - Проверьте "Tables" и "Insights"

4. **Задайте вопрос:**
   - Vercel Community
   - Neon Community
   - GitHub Issues

---

**Дата обновления:** 2026-05-26  
**Статус:** ✅ Готово к продакшену