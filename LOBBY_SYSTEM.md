# Система лобби для multiplayer игры

## Обзор

Полноценная система лобби с WebSocket поддержкой для создания и управления multiplayer сессиями.

## Особенности

- ✅ **Real-time обновления** через Socket.IO
- ✅ **Готовность игроков** - ожидание пока все не будут готовы
- ✅ **Минимальное количество игроков** - игра ждет пока соберется minPlayers
- ✅ **Автозапуск** - автоматический запуск когда собрано минимум игроков и все готовы
- ✅ **Ручной запуск** - хост может запустить игру в любой момент
- ✅ **Обратный отсчет** перед началом игры (5 секунд)
- ✅ **Передача прав хоста** при выходе
- ✅ **Приватные лобби** с паролем
- ✅ **Настройки игры** (сложность, скорость, min/max количество игроков)
- ✅ **Авто-кик неактивных игроков** (30 секунд без heartbeat)
- ✅ **Reconnect поддержка**

## Структура проекта

```
nback-game/
├── app/
│   ├── api/
│   │   ├── lobby/
│   │   │   ├── create/route.ts          # Создание лобби
│   │   │   ├── [lobbyId]/
│   │   │   │   ├── route.ts             # Получить лобби
│   │   │   │   ├── join/route.ts        # Присоединиться
│   │   │   │   ├── leave/route.ts       # Выйти
│   │   │   │   ├── ready/route.ts       # Готовность
│   │   │   │   └── start/route.ts       # Запуск игры
│   │   │   └── list/route.ts            # Список лобби (если нужно)
│   ├── lobbies/page.tsx                 # Список всех лобби
│   └── lobby/[lobbyId]/page.tsx         # Страница лобби
├── components/
│   └── lobby/
│       ├── LobbyList.tsx                # Список лобби
│       └── LobbyRoom.tsx                # Комната ожидания
├── contexts/
│   └── LobbyContext.tsx                 # React Context для WebSocket
├── types/
│   └── lobby.ts                         # TypeScript типы
├── lib/
│   └── socket-server.ts                 # Socket.IO сервер
├── db/
│   └── schema/index.ts                  # Drizzle схемы (lobbies, lobby_players)
└── scripts/
    └── setup-db.js                      # Инициализация БД
```

## Быстрый старт

### 1. Инициализация базы данных

```bash
npm run db:setup
```

### 2. Запуск сервера с WebSocket

Для разработки:

```bash
npm run dev:socket
```

Для продакшена:

```bash
npm run build
npm run start:socket
```

> **Важно:** Используйте `dev:socket` вместо `dev` для работы WebSocket!

### 3. Открыть приложение

Откройте `http://localhost:3000/lobbies` в браузере.

## API Endpoints

### Создание лобби

```http
POST /api/lobby/create
Content-Type: application/json

{
  "gameId": "string",
  "name": "Мое лобби",
  "nValue": 2,
  "baseSpeedMs": 2000,
  "minPlayers": 2,
  "maxPlayers": 4,
  "password": "optional"
}
```

**Параметры:**
- `minPlayers` - минимальное количество игроков для запуска игры (по умолчанию 2)
- `maxPlayers` - максимальное количество игроков (по умолчанию 2)

### Присоединение к лобби

```http
POST /api/lobby/:lobbyId/join
Content-Type: application/json

{
  "password": "optional"
}
```

### Выход из лобби

```http
POST /api/lobby/:lobbyId/leave
```

### Обновление готовности

```http
POST /api/lobby/:lobbyId/ready
Content-Type: application/json

{
  "isReady": true
}
```

### Запуск игры

```http
POST /api/lobby/:lobbyId/start
```

### Получить состояние лобби

```http
GET /api/lobby/:lobbyId
```

### Список доступных лобби

```http
GET /api/lobby/list
```

## WebSocket Events

### Клиент → Сервер

| Event | Данные | Описание |
|-------|--------|----------|
| `lobby:join` | `{ lobbyId, userId, name }` | Присоединение к лобби |
| `lobby:leave` | `{ lobbyId, userId }` | Выход из лобби |
| `lobby:ready` | `{ lobbyId, userId, isReady }` | Обновление готовности |
| `lobby:start` | `{ lobbyId, hostId }` | Запуск игры (хост) |
| `lobby:heartbeat` | `{ lobbyId, userId }` | Поддержание активности |
| `lobby:kick` | `{ lobbyId, hostId, playerId }` | Кик игрока (хост) |
| `lobby:settings` | `{ lobbyId, hostId, settings }` | Обновление настроек |

### Сервер → Клиент

| Event | Данные | Описание |
|-------|--------|----------|
| `lobby:update` | `{ lobby }` | Обновление состояния лобби |
| `lobby:player-joined` | `{ lobbyId, player }` | Игрок присоединился |
| `lobby:player-left` | `{ lobbyId, playerId }` | Игрок покинул лобби |
| `lobby:player-ready` | `{ lobbyId, playerId, isReady }` | Изменилась готовность |
| `lobby:countdown` | `{ lobbyId, seconds }` | Обратный отсчет |
| `lobby:start-game` | `{ lobbyId, sessionId }` | Игра началась |
| `lobby:host-transferred` | `{ lobbyId, newHostId }` | Передан хост |
| `lobby:error` | `{ message, code }` | Ошибка |

## Использование в компонентах

### React Hook

```tsx
import { useLobby } from '@/contexts/LobbyContext';

function MyComponent() {
  const {
    currentLobby,
    isConnected,
    joinLobby,
    leaveLobby,
    setReady,
    startGame,
  } = useLobby();

  const handleJoin = () => {
    joinLobby('lobby-id', 'user-id', 'Username');
  };

  const handleReady = () => {
    setReady('lobby-id', true);
  };

  return (
    <div>
      <p>Подключено: {isConnected ? 'Да' : 'Нет'}</p>
      <button onClick={handleJoin}>Присоединиться</button>
      <button onClick={handleReady}>Готов</button>
    </div>
  );
}
```

### Обертка страницы

```tsx
import { LobbyProvider } from '@/contexts/LobbyContext';

export default function MyPage() {
  return (
    <LobbyProvider userId="user-123" userName="Player">
      <YourComponent />
    </LobbyProvider>
  );
}
```

## База данных

### Таблица `lobbies`

| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT | Primary Key |
| game_id | TEXT | ID шаблона игры |
| name | TEXT | Название лобби |
| status | TEXT | waiting, countdown, in_progress, finished |
| n_value | INTEGER | N-back значение |
| base_speed_ms | INTEGER | Базовая скорость |
| min_players | INTEGER | Минимум игроков для запуска (по умолчанию 2) |
| max_players | INTEGER | Максимум игроков (по умолчанию 2) |
| current_players | INTEGER | Текущее количество |
| host_id | TEXT | ID хоста |
| password | TEXT | Пароль (опционально) |
| auto_start_enabled | INTEGER | Автозапуск включен (0/1) |
| created_at | TEXT | Время создания |
| started_at | TEXT | Время начала |
| finished_at | TEXT | Время окончания |

### Таблица `lobby_players`

| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT | Primary Key |
| lobby_id | TEXT | Foreign key → lobbies |
| user_id | TEXT | ID пользователя |
| name | TEXT | Имя игрока |
| is_ready | INTEGER | Готовность (0/1) |
| is_host | INTEGER | Хост (0/1) |
| connection_id | TEXT | WebSocket connection ID |
| last_heartbeat | TEXT | Последняя активность |
| joined_at | TEXT | Время присоединения |

## Логика запуска игры

### Условия для запуска

Игра запускается когда выполнены ВСЕ условия:

1. **Достаточное количество игроков**: `currentPlayers >= minPlayers`
2. **Все игроки готовы**: `all players have isReady = true`
3. **Статус лобби**: `status = 'waiting'`

### Режимы запуска

#### 1. Ручной запуск (по умолчанию)

Хост может запустить игру в любой момент нажав кнопку "Начать игру", если:
- Достаточное количество игроков собрано
- Все игроки готовы

#### 2. Автозапуск

Если хост включил автозапуск, игра начнется автоматически когда:
- Собрано минимум `minPlayers` игроков
- Все игроки нажали "Готов"

**Важно:** Автозапуск можно включить при создании лобби или в любой момент в комнате ожидания.

### Обратный отсчет

Перед началом игры запускается 5-секундный обратный отсчет:
- Статус лобби меняется на `countdown`
- Все игроки видят таймер
- Во время отсчета нельзя выйти из лобби
- После 5 секунд игра начинается и игроки перенаправляются на страницу игры

### Сценарии

**Сценарий 1: Хост создает лобби с автозапуском**
1. Хост создает лобби с minPlayers=2, maxPlayers=4
2. Включает автозапуск
3. Ждет пока присоединятся игроки
4. Когда присоединяется 2-й игрок и оба нажимают "Готов" → игра запускается автоматически

**Сценарий 2: Ручной запуск**
1. Хост создает лобби без автозапуска
2. Ждет игроков
3. Когда все готовы → кнопка "Начать игру" становится активной
4. Хост нажимает кнопку → игра начинается

**Сценарий 3: Игрок вышел до готовности**
1. В лобби 2 игрока (minPlayers=2)
2. Один игрок не нажал "Готов" и вышел
3. Оставшийся игрок не может запустить игру (нет enough players)
4. Хост передается оставшемуся игроку или лобби ожидает новых игроков

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-min-32-characters
DATABASE_URL=file:./db.sqlite
```

### Socket.IO конфигурация

В `lib/socket-server.ts`:

```typescript
const HEARTBEAT_TIMEOUT = 30000; // 30 секунд
```

Измените при необходимости.

## Расширения

### Добавить чат в лобби

1. Добавьте поле `messages` в `Lobby` интерфейс
2. Реализуйте событие `lobby:chat` в WebSocket сервере
3. Добавьте UI компонент чата в `LobbyRoom.tsx`

### Добавить зрителей

1. Добавьте поле `isSpectator` в `lobby_players`
2. Разрешите неограниченное количество зрителей
3. Зрители не могут ставить ready/start

### Добавить очереди

1. Создайте таблицу `queues`
2. Игроки добавляют себя в очередь
3. Автоматическое создание лобби при заполнении

## Troubleshooting

### WebSocket не подключается

1. Убедитесь что используете `npm run dev:socket` а не `npm run dev`
2. Проверьте что порт 3000 свободен
3. Откройте DevTools → Console → ищите `[Socket]` логи

### Ошибка "Lobby not found"

1. Проверьте что таблицы созданы: `npm run db:setup`
2. Проверьте что лобби существует в БД

### Игроки не видят друг друга

1. Проверьте что все на одной странице лобби
2. Откройте Network tab → ищите WebSocket соединения
3. Проверьте события в консоли сервера

## Лицензия

MIT
