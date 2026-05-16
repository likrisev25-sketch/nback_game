# Боты и Турниры - Документация

## 🤖 ЗАДАЧА 1: БОТ С НАСТРАИВАЕМОЙ ТОЧНОСТЬЮ

### Класс BotPlayer

**Расположение:** `lib/bot/BotPlayer.ts`

#### Основные поля:
- `id: string` - уникальный идентификатор бота
- `name: string` - имя бота (например, "Bot-Alice")
- `accuracy: number` - точность от 0.0 до 1.0 (1.0 = 100%)
- `responseDelayMs: number` - задержка ответа в миллисекундах
- `currentN: number` - текущее значение N
- `stimulusHistory: number[]` - массив последних стимулов (позиций)

#### Основные методы:

```typescript
// Создание бота
const bot = new BotPlayer({
  id: 'bot-1',
  name: 'Bot-Pro',
  accuracy: 0.8,      // 80% точность
  responseDelayMs: 300,
});

// Установка N-значения
bot.setN(3);

// Добавление стимула в историю
bot.addStimulus(position);

// Очистка истории (для нового раунда)
bot.clearHistory();

// Получение правильного ответа
const { shouldPress, isMatch } = bot.getCorrectAnswer();

// Принятие решения с учетом точности
const decision = bot.makeDecision();
// Возвращает: { shouldPress, isCorrect, isMatch, confidence }

// Эмуляция задержки ответа
await bot.simulateDelay();

// Получение статистики
const stats = bot.getStats();
```

#### Пресеты ботов:

```typescript
import { BotPresets } from '@/lib/bot/BotPlayer';

// Легкий бот (50% точность, 800мс задержка)
BotPresets.easy('bot-1', 'Bot-Novice');

// Средний бот (75% точность, 500мс задержка)
BotPresets.medium('bot-1', 'Bot-Pro');

// Сложный бот (95% точность, 300мс задержка)
BotPresets.hard('bot-1', 'Bot-Master');

// Кастомный бот
BotPresets.custom('bot-1', 0.65, 400, 'CustomBot');
```

### Логика принятия решения

1. **Определение правильного ответа:**
   - Если длина истории ≤ N → правильный ответ = `false` (нет сравнения)
   - Иначе: сравнить `currentStimulus` с `stimulusHistory[длина - 1 - N]`
   - `shouldPress = true` если позиции совпадают

2. **Решение с учетом точности:**
   - Сгенерировать `random = Math.random()`
   - Если `random < accuracy` → бот действует правильно
   - Иначе → бот действует ошибочно (наоборот)

3. **Эмуляция задержки:**
   - `setTimeout(() => { отправить действие }, responseDelayMs)`

### Начисление очков (НОВАЯ ЛОГИКА)

**Очки начисляются ТОЛЬКО за активное нажатие на совпадение:**

| Действие | Совпадение? | Очки | Ошибки |
|----------|-------------|------|--------|
| Нажал ✅ | Да | +1 | 0 |
| Нажал ❌ | Нет | 0 | +1 |
| Не нажал | Да | 0 | +1 |
| Не нажал ✓ | Нет | 0 | 0 |

**Пример для бота с accuracy=80%:**
- 80% шанс правильного действия
- Правильное действие при совпадении → нажать → +1 очко
- Правильное действие без совпадения → не нажимать → 0 очков
- Ошибка → ложное нажатие или пропуск → +1 ошибка

### API для настройки точности

#### POST `/api/game/[sessionId]/add-bot`

**Request:**
```json
{
  "accuracy": 0.85,
  "responseDelayMs": 300,
  "name": "Bot-Alice"
}
```

**Response:**
```json
{
  "success": true,
  "bot": {
    "id": "uuid",
    "name": "Bot-Alice",
    "accuracy": 0.85,
    "responseDelayMs": 300,
    "isBot": true
  }
}
```

### Поведение в игре

- Бот получает те же стимулы от сервера, что и люди
- Бот отвечает на каждый ход
- Ошибки бота учитываются в механизме ускорения (каждые 3 ошибки любого участника = ускорение для всех)
- Результаты бота сохраняются в общую таблицу лидеров раунда

---

## 🏆 ЗАДАЧА 2: ТУРНИРНЫЙ РЕЖИМ

### Структура турнира

Турнир — это серия игр (раундов), где:
- Состав участников фиксирован (люди + боты)
- Каждая игра — обычный N-back раунд
- Результаты всех раундов суммируются

### Параметры турнира:
- `players: Array` - массив участников (люди + боты)
- `numberOfRounds: number` - количество раундов
- `roundLengthSec: number` - длительность раунда (шаги)
- `currentRound: number` - индекс текущего раунда
- `scores: Array` - массив общих очков

### База данных

#### Таблица `tournament_results`:

```sql
CREATE TABLE tournament_results (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  is_bot INTEGER DEFAULT 0 NOT NULL,
  bot_accuracy INTEGER,
  total_correct INTEGER DEFAULT 0 NOT NULL,
  total_errors INTEGER DEFAULT 0 NOT NULL,
  round_wins INTEGER DEFAULT 0 NOT NULL,
  rank INTEGER,
  created_at TEXT NOT NULL
);
```

### API

#### POST `/api/tournament/create`

Создание нового турнира.

**Request:**
```json
{
  "name": "Мой турнир",
  "nValue": 2,
  "totalSteps": 30,
  "baseSpeedMs": 2000,
  "maxRounds": 5,
  "addBot": true,
  "botAccuracy": 80,
  "botName": "Bot-Pro"
}
```

**Response:**
```json
{
  "success": true,
  "tournament": { ... },
  "sessionId": "uuid",
  "playerId": "uuid",
  "players": [...],
  "currentRound": 1
}
```

#### POST `/api/tournament/[tournamentId]/results`

Сохранение результатов раунда.

**Request:**
```json
{
  "sessionId": "uuid",
  "roundNumber": 1,
  "playerResults": [
    {
      "playerId": "uuid",
      "correctAnswers": 25,
      "errors": 5,
      "isBot": false
    },
    {
      "playerId": "uuid",
      "correctAnswers": 22,
      "errors": 8,
      "isBot": true,
      "botAccuracy": 80
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "tournamentId": "uuid",
  "roundNumber": 1,
  "results": [
    {
      "playerId": "uuid",
      "totalCorrect": 25,
      "totalErrors": 5,
      "roundWins": 1,
      "rank": 1
    }
  ]
}
```

#### GET `/api/tournament/[tournamentId]/results`

Получение результатов турнира.

**Response:**
```json
{
  "success": true,
  "tournamentId": "uuid",
  "results": [
    {
      "playerId": "uuid",
      "isBot": false,
      "totalCorrect": 125,
      "totalErrors": 25,
      "roundWins": 4,
      "rank": 1
    }
  ]
}
```

### Ход турнира

1. **Старт турнира:**
   - POST `/api/tournament/create`
   - Создается первая сессия и записи в `tournament_results`

2. **Запуск раунда:**
   - Игрок переходит на `/tournament/[id]/round/[roundNumber]`
   - Играет обычный N-back раунд

3. **Завершение раунда:**
   - Результаты сохраняются в sessionStorage
   - POST `/api/tournament/[tournamentId]/results`
   - Обновляется таблица лидеров

4. **Следующий раунд:**
   - Если `currentRound < maxRounds` → переход к следующему раунду
   - Иначе → переход к странице результатов

5. **Завершение турнира:**
   - Отображается финальная таблица лидеров
   - Определяется победитель (max total correct)

### Интерфейс клиента

#### Страницы:
- `/tournament` - создание/настройка турнира
- `/tournament/[id]` - информация о турнире, запуск раунда
- `/tournament/[id]/round/[roundNumber]` - игровой раунд
- `/tournament/[id]/results` - финальные результаты

#### После каждого раунда показывать:
- Результаты раунда (правильные ответы, ошибки)
- Общие очки турнира (таблица лидеров)
- Кнопка "Следующий раунд" (или автоматический переход)

---

## 📊 Пример использования

### Создание турнира с ботом:

```typescript
// Страница создания турнира
const response = await fetch('/api/tournament/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Чемпионат N-Back',
    nValue: 3,
    totalSteps: 30,
    baseSpeedMs: 2000,
    maxRounds: 5,
    addBot: true,
    botAccuracy: 75,
    botName: 'Bot-Challenger'
  })
});

const data = await response.json();
console.log('Турнир создан:', data.tournament.id);
```

### Добавление бота в игру:

```typescript
// Во время игры
const botResponse = await fetch(`/api/game/${sessionId}/add-bot`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accuracy: 0.85,
    responseDelayMs: 300,
    name: 'Bot-Alice'
  })
});
```

### Сохранение результатов раунда:

```typescript
// После завершения раунда
const resultsResponse = await fetch(`/api/tournament/${tournamentId}/results`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    roundNumber: 1,
    playerResults: [
      {
        playerId: currentPlayerId,
        correctAnswers: 25,
        errors: 5,
        isBot: false
      }
    ]
  })
});
```

---

## 🧪 Тесты

### BotPlayer тесты:
```bash
npm test -- bot-player.test.ts
```

### N-back логика тесты:
```bash
npm test -- nback-logic.test.ts
```

Все тесты проходят ✅ (19/19 для BotPlayer, 18/18 для nback-logic)
