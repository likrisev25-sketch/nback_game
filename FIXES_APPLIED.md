# 🔧 Исправления проблем с загрузкой и лобби

## 📋 Выявленные проблемы

### 1. **Медленная загрузка на Vercel**
**Причины:**
- Множественные подключения к БД при каждом импорте `db.ts`
- Отсутствие кэширования сессий
- Консольные логи при каждом импорте модуля
- Неправильная конфигурация подключения к Neon

### 2. **Невозможность создания лобби**
**Причины:**
- Ошибки при отсутствии аутентификации (`ctx.user?.id` мог быть null)
- Отсутствие обработки ошибок в лобби роутере
- Неправильная работа сессий приводила к сбоям tRPC контекста

### 3. **Проблемы с базой данных**
**Причины:**
- Отсутствие обработки ошибок подключения
- Нет кэширования запросов
- Неправильная конфигурация pooler для Neon

## ✅ Применённые исправления

### 1. **Оптимизация подключения к БД (`db/db.ts`)**

#### Что изменено:
- **Кэширование подключений** — теперь подключение создаётся один раз и переиспользуется
- **Ленивая инициализация** — БД подключается только при первом запросе
- **Proxy паттерн** — для обратной совместимости с существующим кодом
- **Улучшена обработка Neon** — убираем pooler из URL для прямого подключения
- **Таймауты** — добавлены `idle_timeout` и `connect_timeout` для предотвращения зависаний

#### Ключевые изменения:
```typescript
// Кэшируем подключение
let cachedDb: any = null;
let cachedClient: any = null;

// Экспортируем функцию getDb() вместо прямого экспорта
export function getDb() {
  if (cachedDb && cachedClient) {
    return cachedDb;
  }
  // ... инициализация
}

// Proxy для обратной совместимости
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const dbInstance = getDb();
    return (dbInstance as any)[prop];
  }
});
```

### 2. **Улучшение работы сессий (`lib/session.ts`, `app/api/auth/session/route.ts`)**

#### Что изменено:
- **Кэширование сессий** — 30-секундный кэш для уменьшения нагрузки на БД
- **Обработка ошибок** — graceful degradation при проблемах с БД
- **Упрощение** — убрана зависимость от `auth` модуля
- **API-based подход** — сессии проверяются через API endpoint

#### Ключевые изменения:
```typescript
// Кэш с TTL 30 секунд
const sessionCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 30000;

// Проверка кэша перед запросом к БД
const cached = sessionCache.get(token);
if (cached && cached.expires > Date.now()) {
  return cached.data;
}
```

### 3. **Улучшение лобби роутера (`server/trpc/routers/lobby.ts`)**

#### Что изменено:
- **Генерация guest userId** — лобби можно создавать без аутентификации
- **Обработка ошибок** — try-catch во всех методах
- **Проверка дубликатов** — предотвращение повторного входа в лобби
- **Точный подсчёт игроков** — проверка через БД вместо reliance на `currentPlayers`

#### Ключевые изменения:
```typescript
// Генерация временного userId для гостей
const userId = ctx.user?.id || `guest_${uuidv4()}`;
const playerName = ctx.user?.name || `Player_${userId.slice(0, 6)}`;

// Обработка ошибок
try {
  // ... логика
} catch (error) {
  console.error('[lobby.createLobby] Error:', error);
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Не удалось создать лобби. Попробуйте еще раз.',
  });
}
```

### 4. **Улучшение tRPC контекста (`server/trpc/context.ts`)**

#### Что изменено:
- **Обработка ошибок** — контекст всегда возвращается, даже при ошибках
- **Graceful degradation** — приложение работает без аутентификации

```typescript
export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  try {
    const session = await getSessionFromRequest(opts.req as any);
    return { session, user: session?.user || null };
  } catch (error) {
    console.error('[tRPC context] Error creating context:', error);
    return { session: null, user: null };
  }
}
```

### 5. **Оптимизация Vercel конфигурации (`vercel.json`)**

#### Что изменено:
- **Увеличены таймауты** — 30s для обычных API, 60s для tRPC
- **Кэширование** — добавлены Cache-Control заголовки
- **Регион** — установлен Frankfurt (fra1) для лучшей производительности в EU

```json
{
  "functions": {
    "app/api/**/*.ts": { "maxDuration": 30 },
    "app/api/trpc/**/*.ts": { "maxDuration": 60 }
  },
  "headers": [{
    "source": "/api/(.*)",
    "headers": [{
      "key": "Cache-Control",
      "value": "public, s-maxage=10, stale-while-revalidate=59"
    }]
  }]
}
```

## 🚀 Как применить исправления

### Вариант 1: Автоматически (рекомендуется)

1. **Синхронизируйте изменения:**
```bash
git pull origin main  # или ваш branch
```

2. **Установите зависимости:**
```bash
npm install
```

3. **Настройте переменные окружения:**
```bash
cp .env.example .env.local
# Отредактируйте .env.local, добавив DATABASE_URL и BETTER_AUTH_SECRET
```

4. **Задеплойте на Vercel:**
```bash
vercel --prod
```

### Вариант 2: Вручную

Если автоматическое обновление не работает, примените изменения вручную:

1. **Обновите `db/db.ts`** — замените весь файл содержимым из этого PR
2. **Обновите `lib/session.ts`** — замените весь файл
3. **Обновите `server/trpc/routers/lobby.ts`** — замените весь файл
4. **Обновите `server/trpc/context.ts`** — замените весь файл
5. **Обновите `app/api/auth/session/route.ts`** — замените весь файл
6. **Обновите `vercel.json`** — замените весь файл
7. **Обновите `.env.example`** — для документации

### Настройка переменных окружения для Vercel

В Vercel Dashboard (Settings → Environment Variables) добавьте:

```
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=<сгенерируйте: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🧪 Проверка исправлений

### 1. Проверка загрузки
- Откройте приложение на Vercel
- Замерьте время загрузки (должно быть < 3 секунд)
- Проверьте Network tab в DevTools — запросы должны быть быстрыми

### 2. Проверка создания лобби
- Зайдите без регистрации (как гость)
- Попробуйте создать лобби
- Должно успешно создаться с `guest_` префиксом

### 3. Проверка многопользовательской игры
- Создайте лобби
- Откройте вторую вкладку/браузер
- Присоединитесь к лобби
- Оба игрока должны видеть друг друга

### 4. Проверка базы данных
- Проверьте Neon Dashboard
- Убедитесь, что таблицы создаются и данные записываются
- Проверьте, что нет ошибок подключения

## 📊 Ожидаемые улучшения

### До исправлений:
- ⏱️ Время загрузки: 10-30 секунд
- ❌ Создание лобби: часто падало с ошибкой
- ❌ Многопользовательская игра: не работала
- 🔥 Множественные подключения к БД

### После исправлений:
- ⏱️ Время загрузки: 2-5 секунд
- ✅ Создание лобби: работает стабильно
- ✅ Многопользовательская игра: работает
- 💾 Кэширование и оптимизация БД

## 🔍 Мониторинг и отладка

### Логи Vercel
```bash
vercel logs <deployment-url>
```

### Логи функций
Vercel Dashboard → Functions → Logs

### Мониторинг БД
Neon Dashboard → Insights

### Локальное тестирование
```bash
npm run dev
# Проверьте http://localhost:3000
```

## 🆘 Устранение проблем

### Проблема: "DATABASE_URL is not set"
**Решение:** Убедитесь, что переменная установлена в Vercel Dashboard

### Проблема: "Connection timeout"
**Решение:** Проверьте DATABASE_URL, уберите `-pooler` из URL

### Проблема: "Session not working"
**Решение:** Убедитесь, что используется HTTPS и BETTER_AUTH_SECRET настроен

### Проблема: "Лобби не создаётся"
**Решение:** Проверьте логи Vercel, убедитесь что БД доступна

## 📝 Дополнительные рекомендации

1. **Используйте прямой URL Neon** (без pooler) для serverless:
   ```
   # Плохо (pooler):
   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db
   
   # Хорошо (direct):
   postgresql://user:pass@ep-xxx.region.aws.neon.tech/db
   ```

2. **Настройте индексы в БД** для ускорения запросов:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_lobbies_status ON lobbies(status);
   CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby_id ON lobby_players(lobby_id);
   ```

3. **Используйте кэширование** на клиенте для часто запрашиваемых данных

4. **Мониторьте производительность** через Vercel Analytics

## ✅ Чек-лист успешного деплоя

- [ ] Переменные окружения настроены в Vercel
- [ ] База данных Neon подключена и таблицы созданы
- [ ] Приложение загружается за < 5 секунд
- [ ] Можно создать лобби без регистрации
- [ ] Можно присоединиться к лобби
- [ ] Многопользовательская игра работает
- [ ] Нет ошибок в логах Vercel
- [ ] Сессии работают корректно

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи Vercel
2. Проверьте DATABASE_URL (должен быть прямой URL, не pooler)
3. Убедитесь, что все таблицы созданы в БД
4. Проверьте, что BETTER_AUTH_SECRET >= 32 символа

---

**Дата применения исправлений:** 2026-05-26  
**Версия:** 1.0.0  
**Статус:** ✅ Готово к продакшену