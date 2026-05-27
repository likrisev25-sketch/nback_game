# 🎮 Руководство по настройке лобби системы

## 📋 Обзор

Система лобби позволяет игрокам создавать комнаты для многопользовательской игры в N-Back. Поддерживается как игра с авторизацией, так и без неё (гости).

## 🚀 Быстрый старт

### Для игроков

1. **Без регистрации (гость)**:
   - Перейдите на страницу `/lobby`
   - Нажмите "Создать лобби"
   - Заполните параметры и создайте лобби
   - Поделитесь ссылкой с друзьями

2. **С регистрацией**:
   - Зарегистрируйтесь через `/register`
   - Войдите через `/login`
   - Перейдите на страницу `/lobby`
   - Создайте или присоединитесь к лобби

### Для разработчиков

#### Использование tRPC хуков

```typescript
import { trpc } from '@/lib/trpc-client';

// Получение списка лобби
const listLobbies = trpc.lobby.listLobbies.useQuery();

// Создание лобби
const createLobby = trpc.lobby.createLobby.useMutation({
  onSuccess: (data) => {
    console.log('Лобби создано:', data.lobbyId);
  }
});

// Присоединение к лобби
const joinLobby = trpc.lobby.joinLobby.useMutation({
  onSuccess: (data) => {
    console.log('Присоединился к лобби');
  }
});

// Вызов мутаций
createLobby.mutate({
  gameId: 'default',
  name: 'Моё лобби',
  nValue: 2,
  baseSpeedMs: 2000,
  maxPlayers: 4,
});

joinLobby.mutate({ lobbyId: 'abc123' });
```

## ⚙️ Параметры лобби

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `gameId` | string | - | ID игры (обязательно) |
| `name` | string | - | Название лобби |
| `nValue` | number | 2 | N-back значение (1-5) |
| `baseSpeedMs` | number | 2000 | Скорость показа в мс (500-5000) |
| `maxPlayers` | number | 4 | Максимум игроков (2-10) |
| `password` | string? | - | Пароль для входа (опционально) |

## 🔧 API Reference

### tRPC Endpoints

#### `lobby.listLobbies`
Получение списка активных лобби.

**Параметры:** Нет

**Ответ:**
```typescript
{
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  nValue: number;
  baseSpeedMs: number;
  players: Array<{
    name: string;
    isHost: boolean;
  }>;
  playerCount: number;
}[]
```

#### `lobby.createLobby`
Создание нового лобби.

**Параметры:**
```typescript
{
  gameId: string;
  name: string;
  nValue?: number;
  baseSpeedMs?: number;
  maxPlayers?: number;
  password?: string;
}
```

**Ответ:**
```typescript
{
  lobbyId: string;
  success: boolean;
}
```

#### `lobby.joinLobby`
Присоединение к существующему лобби.

**Параметры:**
```typescript
{
  lobbyId: string;
  password?: string;
}
```

**Ответ:**
```typescript
{
  success: boolean;
  playerId: string;
}
```

#### `lobby.getLobby`
Получение информации о конкретном лобби.

**Параметры:**
```typescript
{
  lobbyId: string;
}
```

**Ответ:**
```typescript
{
  id: string;
  name: string;
  status: 'waiting' | 'playing' | 'finished';
  currentPlayers: number;
  maxPlayers: number;
  nValue: number;
  baseSpeedMs: number;
  players: Array<{
    id: string;
    name: string;
    isReady: boolean;
    isHost: boolean;
    isBot: boolean;
  }>;
}
```

#### `lobby.setReady`
Установка готовности игрока.

**Параметры:**
```typescript
{
  lobbyId: string;
  isReady: boolean;
}
```

**Ответ:**
```typescript
{
  success: boolean;
}
```

## 🗄️ База данных

### Таблица `lobbies`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | string | UUID лобби |
| `gameId` | string | ID игры |
| `name` | string | Название |
| `status` | string | Статус (waiting/playing/finished) |
| `nValue` | number | N-back значение |
| `baseSpeedMs` | number | Базовая скорость |
| `minPlayers` | number | Минимум игроков |
| `maxPlayers` | number | Максимум игроков |
| `currentPlayers` | number | Текущее количество |
| `hostId` | string | ID создателя |
| `password` | string? | Пароль |
| `autoStartEnabled` | boolean | Авто-старт |
| `createdAt` | datetime | Дата создания |
| `startedAt` | datetime? | Дата старта |
| `finishedAt` | datetime? | Дата завершения |

### Таблица `lobby_players`

| Колонка | Тип | Описание |
|---------|-----|----------|
| `id` | string | UUID записи |
| `lobbyId` | string | Ссылка на лобби |
| `userId` | string | ID пользователя |
| `name` | string | Имя игрока |
| `isReady` | boolean | Готовность |
| `isHost` | boolean | Является ли хостом |
| `isBot` | boolean | Является ли ботом |
| `botAccuracy` | number? | Точность бота |
| `joinedAt` | datetime | Дата присоединения |

## 🔐 Аутентификация

### Гости (без авторизации)
- При создании лобби генерируется временный `userId` с префиксом `guest_`
- Имя игрока формируется как `Player_XXXXXX`
- Гости могут создавать и присоединяться к лобби

### Авторизованные пользователи
- Используется реальный `userId` из сессии
- Имя берётся из профиля пользователя
- Сессионные куки автоматически передаются через tRPC

## 🧪 Тестирование

### Ручное тестирование

1. **Создание лобби:**
   ```bash
   node test-trpc-lobby.js
   ```

2. **Проверка в браузере:**
   - Откройте `http://localhost:3000/lobby`
   - Создайте лобби
   - Проверьте, что оно появилось в списке

3. **Присоединение к лобби:**
   - Откройте вторую вкладку
   - Найдите созданное лобби в списке
   - Нажмите "Присоединиться"

### Автоматические тесты

```bash
npm test
```

## 🐛 Устранение проблем

### Ошибка: "Необходимо авторизоваться"

**Причина:** Прямые API вызовы без передачи кук.

**Решение:** Используйте tRPC хуки, которые автоматически передают куки.

### Лобби не создаётся

**Причина:** Проблемы с базой данных или подключением.

**Решение:**
1. Проверьте подключение к БД
2. Убедитесь, что таблицы созданы
3. Проверьте логи сервера

### Игроки не видят друг друга

**Причина:** Проблемы с обновлением данных.

**Решение:**
1. Проверьте, что `refetchInterval` настроен корректно
2. Убедитесь, что оба игрока используют одинаковый `lobbyId`

## 📝 Примеры использования

### Пример 1: Создание простого лобби

```typescript
const createLobby = trpc.lobby.createLobby.useMutation();

createLobby.mutate({
  gameId: 'nback',
  name: 'Быстрая игра',
  nValue: 2,
  baseSpeedMs: 1500,
  maxPlayers: 2,
});
```

### Пример 2: Создание защищённого паролем лобби

```typescript
createLobby.mutate({
  gameId: 'nback',
  name: 'Приватная игра',
  nValue: 3,
  baseSpeedMs: 2000,
  maxPlayers: 4,
  password: 'secret123',
});
```

### Пример 3: Присоединение к лобби с паролем

```typescript
const joinLobby = trpc.lobby.joinLobby.useMutation();

joinLobby.mutate({
  lobbyId: 'abc123',
  password: 'secret123',
});
```

### Пример 4: Отслеживание статуса создания

```typescript
const createLobby = trpc.lobby.createLobby.useMutation({
  onMutate: () => {
    console.log('Создание лобби...');
  },
  onSuccess: (data) => {
    console.log('Лобби создано:', data.lobbyId);
    router.push(`/lobby/${data.lobbyId}`);
  },
  onError: (error) => {
    console.error('Ошибка:', error.message);
  },
});
```

## 🔗 Ссылки

- [tRPC документация](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Next.js App Router](https://nextjs.org/docs/app)

---

**Версия:** 2.0.0  
**Последнее обновление:** 2026-05-27  
**Статус:** ✅ Готово к использованию