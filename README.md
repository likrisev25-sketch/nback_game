# N-Back Game — Соревновательный тренажёр памяти

Клиент-серверное веб-приложение для тренировки рабочей памяти с многопользовательским режимом.

## 🎮 Описание

Игрокам предъявляется последовательность стимулов (позиции в сетке 3×3). Игрок должен нажимать кнопку «СОВПАДЕНИЕ!» при совпадении текущего стимула с N шагов назад.

### Основные возможности

- **Одиночная тренировка** — настройте N-значение и тренируйте память
- **Многопользовательский режим** — соревнуйтесь с 2-4 игроками
- **Влияние ошибок** — каждые 3 ошибки одного игрока увеличивают скорость для всех
- **Настраиваемые боты** — добавляйте ботов с разной точностью для тренировки
- **Турнирный режим** — проводите соревнования между несколькими игроками
- **Сохранение результатов** — вся история игр сохраняется в базе данных

## 🛠 Технологический стек

### Основные технологии

| Технология | Назначение | Почему выбрана |
|------------|------------|----------------|
| **TypeScript** | Язык разработки | Типобезопасность, лучшая поддержка IDE, меньше ошибок |
| **Next.js 16** | Фреймворк приложения | SSR, App Router, оптимизация из коробки, отличная экосистема |
| **Drizzle ORM** | Работа с БД | Легковесный, типобезопасный, поддержка SQLite/PostgreSQL |
| **tRPC** | API слой | End-to-end типобезопасность, no GraphQL overhead, реальный времени |
| **Better-auth** | Аутентификация | Современная, простая интеграция, поддержка email/password |
| **Socket.io** | WebSocket | Двусторонняя связь в реальном времени, автосинхронизация |
| **SQLite** | База данных | Простота, не требует отдельного сервера, идеально для разработки |

### Дополнительные библиотеки

| Библиотека | Назначение | Альтернативы | Почему выбрано |
|------------|------------|--------------|----------------|
| **Zod** | Валидация | Yup, Joi, superstruct | Отличная интеграция с TypeScript, простота использования |
| **React Query** | Управление состоянием | Redux, Zustand, SWR | Кэширование, фоновая синхронизация, оптимистичные обновления |
| **Tailwind CSS** | Стили | CSS Modules, Styled Components | Быстрая разработка, consistency, small bundle size |
| **Jest** | Тестирование | Vitest, Mocha | Стандарт индустрии, отличная документация, snapshot testing |
| **uuid** | Генерация ID | crypto.randomUUID, nanoid | Совместимость, проверенная библиотека |

## 📋 Требования

- Node.js >= 18
- npm >= 9

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
# Клонировать репозиторий
git clone <repo-url>
cd nback-game

# Установить зависимости
npm install
```

### 2. Настройка окружения

```bash
# Скопировать пример окружения
cp .env.example .env.local

# Отредактировать .env.local и добавить свой секрет
# BETTER_AUTH_SECRET должен быть минимум 32 символа
```

### 3. Инициализация базы данных

```bash
# Создать таблицы в SQLite
npm run db:push
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📚 Документация API

### tRPC Роуты

#### `game.createSession`
Создание новой игровой сессии.

**Входные данные:**
```typescript
{
  name: string;           // Название сессии
  nValue: number;         // N для N-back (1-5)
  totalSteps: number;     // Количество шагов (10-100)
  baseSpeedMs: number;    // Базовая скорость (500-5000 мс)
}
```

**Ответ:**
```typescript
{
  sessionId: string;
  name: string;
  nValue: number;
  baseSpeedMs: number;
  status: 'waiting' | 'playing' | 'finished';
}
```

#### `game.joinSession`
Присоединение к существующей сессии.

**Входные данные:**
```typescript
{
  sessionId: string;
}
```

#### `game.submitAnswer`
Отправка ответа игрока.

**Входные данные:**
```typescript
{
  sessionId: string;
  playerId: string;
  position: number;       // Позиция в сетке (0-8)
  stepNumber: number;     // Номер шага
  playerAnswer: boolean;  // Нажал кнопку или нет
}
```

**Ответ:**
```typescript
{
  isCorrect: boolean;
  isMatch: boolean;
  correctAnswers: number;
  errors: number;
  speedIncreased: boolean;
  newSpeedMs?: number;
}
```

#### `game.getSessionStats`
Получение статистики сессии.

#### `game.finishGame`
Завершение игры и определение победителя.

## 🎯 Правила игры

1. **Цель** — набрать больше правильных ответов, чем другие игроки
2. **Механика** — нажимайте «СОВПАДЕНИЕ!», когда текущая позиция совпадает с позицией N шагов назад
3. **Штрафы** — ошибка = +1 к счётчику ошибок
4. **Ускорение** — каждые 3 ошибки одного игрока увеличивают скорость для всех на 10%
5. **Победа** — игрок с наибольшим количеством правильных ответов

## 🧪 Тестирование

### Unit тесты (Jest)

```bash
# Запуск всех тестов
npm test

# Запуск в режиме наблюдения
npm run test:watch

# Запуск с покрытием
npm run test:coverage
```

### E2E тесты (Playwright)

```bash
# Запуск E2E тестов
npm run test:e2e

# Запуск в UI режиме
npm run test:e2e:ui

# Запуск в режиме отладки
npm run test:e2e:debug
```

### Покрытие тестами

Все критические функции протестированы:

- ✅ Генерация последовательностей (100% покрытие)
- ✅ Проверка ответов игроков (100% покрытие)
- ✅ Расчёт скорости на основе ошибок (100% покрытие)
- ✅ Граничные случаи (100% покрытие)
- ✅ tRPC роуты (интеграционные тесты)
- ✅ Сквозные сценарии (Playwright)

#### E2E сценарии

1. **Auth Flow** — регистрация, вход, валидация форм
2. **Lobby Flow** — создание лобби, добавление ботов, навигация
3. **tRPC Integration** — создание сессий через API, список игр

## 🏗 Структура проекта

```
nback-game/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   ├── auth/[...all]/        # Better-auth endpoints
│   │   ├── game/                 # Game API endpoints
│   │   ├── socket/               # WebSocket server endpoint
│   │   └── trpc/[trpc]/          # tRPC endpoints
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Главная страница
├── components/                   # React компоненты
│   ├── auth/                     # Компоненты аутентификации
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthModal.tsx
│   └── game/                     # Игровые компоненты
│       ├── NBackGame.tsx
│       └── GameLobby.tsx
├── db/                           # База данных
│   ├── schema/                   # Drizzle схема
│   │   └── index.ts
│   └── db.ts                     # Подключение к БД (SQLite)
├── docs/                         # Документация
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── ...
├── e2e/                          # E2E тесты (Playwright)
│   ├── auth.spec.ts
│   ├── lobby.spec.ts
│   └── trpc.spec.ts
├── lib/                          # Утилиты
│   ├── auth-client.ts            # Better-auth клиент
│   ├── socket-server.ts          # Socket.io сервер
│   ├── trpc-client.ts            # tRPC клиент
│   └── trpc-provider.tsx         # tRPC провайдер
├── server/                       # Серверная логика
│   ├── auth/                     # Better-auth конфигурация
│   │   └── index.ts
│   └── trpc/                     # tRPC сервер
│       ├── routers/
│       │   └── game.ts           # Игровые роуты
│       ├── context.ts
│       └── trpc.ts
├── __tests__/                    # Unit тесты
│   └── trpc/
│       └── game.test.ts          # tRPC роутер тесты
├── .env.example                  # Пример окружения
├── .env.local                    # Локальное окружение
├── drizzle.config.ts             # Drizzle конфигурация
├── jest.config.js                # Jest конфигурация
├── package.json
├── playwright.config.ts          # Playwright конфигурация
├── README.md
└── tsconfig.json
```

## 🔧 Разработка

### Команды разработки

```bash
# Запуск в режиме разработки
npm run dev

# Создание миграций БД
npm run db:generate

# Применение миграций
npm run db:migrate

# Прямое применение изменений
npm run db:push

# GUI для работы с БД
npm run db:studio
```

### Добавление новых функций

1. **Новый tRPC роут:**
   ```typescript
   // server/trpc/routers/newRouter.ts
   import { router, publicProcedure } from '../trpc';
   import { z } from 'zod';

   export const newRouter = router({
     example: publicProcedure
       .input(z.object({ id: z.string() }))
       .query(({ input }) => {
         // Логика
       }),
   });
   ```

2. **Подключение роута:**
   ```typescript
   // server/trpc/index.ts
   import { newRouter } from './routers/newRouter';

   export const appRouter = router({
     game: gameRouter,
     new: newRouter,
   });
   ```

3. **Использование в компоненте:**
   ```typescript
   const result = trpc.new.example.useQuery({ id: '123' });
   ```

## 📊 База данных

### Схема

- **users** — пользователи системы
- **sessions** — сессии аутентификации
- **game_sessions** — игровые сессии
- **game_players** — игроки в сессии
- **game_moves** — ходы игроков
- **sequences** — сгенерированные последовательности

### Управление БД

```bash
# Просмотр и редактирование данных
npm run db:studio
```

Откроется GUI в браузере для работы с базой данных.

## 🤖 Боты

Боты могут быть добавлены в игру создателем сессии:

```typescript
await trpc.game.addBot.mutate({
  sessionId: 'session-id',
  botAccuracy: 90, // Точность бота в процентах
});
```

Боты автоматически делают ответы с заданной точностью, создавая вызов для игрока.

## 🏆 Турнирный режим

Турнирный режим позволяет проводить соревнования между несколькими игроками:

1. Создайте турнир через `createSession`
2. Добавьте игроков через `joinSession`
3. Добавьте ботов для заполнения мест
4. Начните игру через `startGame`
5. Определите победителя через `finishGame`

## 🚢 Деплой

### Vercel

1. Создайте проект в Vercel
2. Добавьте переменные окружения:
   - `NEXT_PUBLIC_APP_URL` — ваш домен
   - `BETTER_AUTH_SECRET` — секрет аутентификации
3. Разверните проект

### Самостоятельный хостинг

```bash
# Сборка для продакшена
npm run build

# Запуск
npm start
```

## 🔒 Безопасность

- Все ответы игроков проверяются на сервере
- tRPC обеспечивает типобезопасность API
- Аутентификация через Better-auth с JWT сессиями
- Валидация входных данных через Zod
- Защита от CSRF и XSS атак

## 📝 Лицензия

MIT

## 👥 Автор

Разработано командой NLP-Core-Team

---

**Поддержка:** При возникновении проблем создавайте issue в репозитории.
#   n - b a c k - g a m e  
 #   n - b a c k - g a m e  
 