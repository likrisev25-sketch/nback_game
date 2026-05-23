# 🎮 N-Back Game - Полная Документация

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Система лобби](#система-лобби)
3. [Система турниров](#система-турниров)
4. [API Reference](#api-reference)
5. [WebSocket Events](#websocket-events)
6. [Архитектура](#архитектура)
7. [Разработка](#разработка)

---

## Быстрый старт

### Установка

```bash
# Клонируйте репозиторий
cd nback-game

# Установите зависимости
npm install
```

### Настройка базы данных

```bash
# Основные таблицы
npm run db:setup

# Таблицы для лобби
npm run db:setup-lobby

# Таблицы для турниров
npm run db:setup-tournament
```

### Запуск

```bash
# Режим разработки
npm run dev

# С WebSocket сервером
npm run dev:socket
```

Откройте http://localhost:3000

---

## Система лобби

### Создание лобби

**URL:** `/lobbies`

**Шаги:**
1. Нажмите "+ Создать лобби"
2. Заполните форму:
   - **Название** (опционально) - имя лобби
   - **Минимум игроков** (2-6) - сколько нужно для запуска
   - **Максимум игроков** (2-6) - максимальное количество
   - **N-back значение** (1-4) - сложность игры
   - **Скорость** (1000-3000ms) - время на один шаг
   - **Пароль** (опционально) - защита лобби

3. Нажмите "Создать"
4. Выберите стратегию:
   - **Начать игру сразу** - ручной запуск
   - **Включить автозапуск** - автоматический запуск когда все готовы

### Игра в лобби

После запуска лобби:
1. Статус меняется на `in_progress`
2. Показывается игра N-back
3. Игрок видит:
   - Сетку 3x3 с подсветкой позиций
   - Кнопку "Совпадение"
   - Счёт: правильные ответы / ошибки
   - Текущий шаг и общее количество
   - Таблицу лидеров
4. Механика: нажмите "Совпадение" если текущая позиция совпадает с позицией N шагов назад
5. После завершения возвращаетесь в лобби

### Управление лобби

**Кнопки:**
- **Готов/Не готов** - пометить себя готовым к игре
- **Начать игру** (только хост) - запустить игру вручную
- **Автозапуск** (только хост) - включить автоматический запуск
- **Выйти** - покинуть лобби

**Условия запуска:**
- Все игроки нажали "Готов"
- Достигнуто минимальное количество игроков
- Хост нажал "Начать игру" ИЛИ включён автозапуск

---

## Система турниров

### Создание турнира

**URL:** `/tournaments`

**Шаги:**
1. Нажмите "+ Создать турнир"
2. Заполните форму:
   - **Название** - имя турнира
   - **N-значение** (1-4) - сложность
   - **Раундов** (3/5/10) - количество раундов
   - **Шагов в раунде** (20/30/50) - длительность
   - **Скорость** (1500-2500ms) - базовая скорость
   - **Минимум игроков** (2-4)
   - **Максимум игроков** (2-6)
   - **Пароль** (опционально)

3. Нажмите "Создать турнир"

### Присоединение к турниру

1. Найдите турнир в списке (статус `waiting`)
2. Нажмите "Присоединиться"
3. На странице турнира нажмите "Готов"
4. Дождитесь начала от хоста

### Запуск турнира

**Условия:**
- Все игроки готовы
- Минимум 2 игрока
- Хост нажал "Начать турнир"

**Процесс:**
1. Обратный отсчет (5 секунд)
2. Турнир переходит в статус `playing`
3. Начинается первый раунд

---

## API Reference

### Лобби

#### GET `/api/lobby/list`
Получить список активных лобби

**Response:**
```json
{
  "success": true,
  "lobbies": [
    {
      "id": "abc123",
      "name": "Лобби abc123",
      "nValue": 2,
      "baseSpeedMs": 2000,
      "minPlayers": 2,
      "maxPlayers": 4,
      "currentPlayers": 2,
      "hostId": "user123",
      "status": "waiting",
      "players": [...]
    }
  ]
}
```

#### POST `/api/lobby/create`
Создать новое лобби

**Body:**
```json
{
  "gameId": "default",
  "name": "Мое лобби",
  "nValue": 2,
  "baseSpeedMs": 2000,
  "minPlayers": 2,
  "maxPlayers": 4,
  "password": "optional",
  "userName": "Игрок"
}
```

#### POST `/api/lobby/[id]/join`
Присоединиться к лобби

#### POST `/api/lobby/[id]/leave`
Покинуть лобби

#### POST `/api/lobby/[id]/ready`
Изменить статус готовности

**Body:**
```json
{
  "userId": "user123",
  "isReady": true
}
```

#### POST `/api/lobby/[id]/start`
Запустить игру (только хост)

---

### Турниры

#### GET `/api/tournament/list`
Получить список турниров (статус `waiting`)

#### POST `/api/tournament/create`
Создать турнир

**Body:**
```json
{
  "name": "Турнир 2024",
  "nValue": 2,
  "totalSteps": 30,
  "baseSpeedMs": 2000,
  "maxRounds": 5,
  "minPlayers": 2,
  "maxPlayers": 4,
  "userId": "user123",
  "userName": "Игрок"
}
```

#### POST `/api/tournament/join`
Присоединиться к турниру

#### GET `/api/tournament/[id]`
Получить данные турнира

---

### Игры

#### POST `/api/game/create`
Создать игровую сессию

#### GET `/api/game/[id]/sequence`
Получить последовательность N-back

#### POST `/api/game/[id]/answer`
Отправить ответ

**Body:**
```json
{
  "sessionId": "session123",
  "playerId": "player123",
  "position": 5,
  "stepNumber": 10,
  "playerAnswer": true
}
```

#### GET `/api/game/[id]/stats`
Получить статистику

---

## WebSocket Events

### Лобби

**Клиент → Сервер:**
- `lobby:join` - присоединение к лобби
- `lobby:leave` - выход из лобби
- `lobby:ready` - изменение статуса готовности
- `lobby:start` - запуск игры
- `lobby:heartbeat` - поддержание активности

**Сервер → Клиент:**
- `lobby:update` - обновление данных лобби
- `lobby:player-joined` - игрок присоединился
- `lobby:player-left` - игрок покинул
- `lobby:player-ready` - готовность изменена
- `lobby:countdown` - обратный отсчет
- `lobby:start-game` - запуск игры
- `lobby:error` - ошибка

### Турниры

**Клиент → Сервер:**
- `tournament:join` - присоединение
- `tournament:leave` - выход
- `tournament:ready` - готовность
- `tournament:start` - запуск

**Сервер → Клиент:**
- `tournament:update` - обновление
- `tournament:player-joined` - игрок присоединился
- `tournament:player-left` - игрок покинул
- `tournament:player-ready` - готовность изменена
- `tournament:countdown` - обратный отсчет
- `tournament:start-game` - запуск игры
- `tournament:error` - ошибка

---

## Архитектура

### Frontend

```
app/
├── page.tsx                    # Главная страница
├── lobbies/                    # Список лобби
│   └── page.tsx
├── lobby/[lobbyId]/            # Комната лобби
│   └── page.tsx
├── tournaments/                # Список турниров
│   └── page.tsx
└── tournament/[id]/            # Комната турнира
    └── page.tsx
```

### Компоненты

```
components/
├── lobby/
│   ├── LobbyList.tsx           # Список лобби
│   └── LobbyRoom.tsx           # Комната с игрой
└── game/
    ├── NBackGame.tsx           # Основной компонент игры
    ├── GameRoom.tsx            # Игра для лобби
    └── Grid3x3.tsx             # Сетка 3x3
```

### Backend

```
api/
├── lobby/
│   ├── create/route.ts         # Создание лобби
│   ├── list/route.ts           # Список лобби
│   └── [id]/
│       ├── route.ts            # Данные лобби
│       ├── join/route.ts       # Присоединиться
│       ├── leave/route.ts      # Выйти
│       ├── ready/route.ts      # Готовность
│       └── start/route.ts      # Запуск
├── tournament/
│   ├── create/route.ts
│   ├── list/route.ts
│   ├── join/route.ts
│   └── [id]/route.ts
└── game/
    ├── create/route.ts
    ├── list/route.ts
    └── [id]/
        ├── start/route.ts
        ├── sequence/route.ts
        ├── answer/route.ts
        └── stats/route.ts
```

### База данных

**Таблицы:**
- `users` - пользователи
- `sessions` - сессии авторизации
- `lobbies` - лобби игр
- `lobby_players` - игроки в лобби
- `tournaments` - турниры
- `tournament_players` - игроки в турнирах
- `game_sessions` - игровые сессии
- `game_players` - игроки в играх
- `game_moves` - ходы игры
- `sequences` - последовательности N-back
- `tournament_results` - результаты турниров

### WebSocket Server

**Расположение:** `lib/socket-server.ts`

**Инициализация:**
```typescript
import { initSocket } from '@/lib/socket-server';
import { createServer } from 'http';
import { NextRequest } from 'next/server';

const server = createServer(handler);
initSocket(server);
```

---

## Разработка

### Скрипты

```bash
# Разработка
npm run dev

# Разработка с Socket.IO
npm run dev:socket

# Сборка
npm run build

# Продакшен
npm run start
npm run start:socket

# Тесты
npm test
npm run test:watch

# Линтинг
npm run lint

# База данных
npm run db:setup
npm run db:setup-lobby
npm run db:setup-tournament
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

### Структура данных

**Лобби:**
```typescript
interface Lobby {
  id: string;
  name: string;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  nValue: number;
  baseSpeedMs: number;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  hostId: string;
  password?: string;
  autoStartEnabled: boolean;
  players: LobbyPlayer[];
}
```

**Турнир:**
```typescript
interface Tournament {
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  maxRounds: number;
  currentRound: number;
  minPlayers: number;
  maxPlayers: number;
  players: TournamentPlayer[];
}
```

### Известные ограничения

1. **Авторизация** - временно упрощена для тестирования
2. **Турнирная игра** - игра в турнирах пока не реализована
3. **Деплой** - требуется настройка Socket.IO на продакшене

### Следующие шаги

- [ ] Добавить полноценную авторизацию
- [ ] Реализовать игру в турнирах
- [ ] Добавить рейтинговую систему
- [ ] Добавить историю игр
- [ ] Добавить достижения и награды
- [ ] Добавить чат в лобби
- [ ] Добавить реплеи игр
- [ ] Добавить мобильную версию

---

## Контакты

Проект разработан командой NLP-Core-Team
