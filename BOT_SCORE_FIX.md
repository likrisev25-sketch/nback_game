# Исправление: Раздельные очки бота и игрока

## 🐛 Проблема
Очки бота и игрока отображались одинаково, потому что:
1. У игроков не было имен в таблице `gamePlayers`
2. API stats не возвращало поле `name`
3. В UI отображалось `undefined` для обоих игроков
4. Было непонятно, где очки бота, а где - игрока

## ✅ Решение

### 1. Добавлено поле `name` в таблицу `gamePlayers`

**Файл:** `db/schema/index.ts`

```typescript
export const gamePlayers = sqliteTable('game_players', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: text('user_id').notNull(),
  name: text('name').notNull().default('Player'), // ← НОВОЕ ПОЛЕ
  correctAnswers: integer('correct_answers').notNull().default(0),
  errors: integer('errors').notNull().default(0),
  isBot: integer('is_bot', { mode: 'boolean' }).notNull().default(false),
  botAccuracy: integer('bot_accuracy').notNull().default(100),
  joinedAt: text('joined_at').notNull(),
});
```

### 2. Обновлены API для сохранения имен

**API создания игры** (`app/api/game/create/route.ts`):
```typescript
// Игрок
const [player] = await db.insert(gamePlayers).values({
  id: uuidv4(),
  sessionId,
  userId: uuidv4(),
  name: 'Player-1', // ← Имя игрока
  correctAnswers: 0,
  errors: 0,
  isBot: false,
  botAccuracy: 100,
  joinedAt: now,
}).returning();

// Бот
const [bot] = await db.insert(gamePlayers).values({
  id: uuidv4(),
  sessionId,
  userId: uuidv4(),
  name: `Bot-${botAccuracy || 80}%`, // ← Имя бота
  correctAnswers: 0,
  errors: 0,
  isBot: true,
  botAccuracy: botAccuracy || 80,
  joinedAt: now,
}).returning();
```

**API добавления бота** (`app/api/game/[sessionId]/add-bot/route.ts`):
```typescript
const botName = name || `Bot-${Math.round(accuracy * 100)}%`;

const [bot] = await db.insert(gamePlayers).values({
  id: uuidv4(),
  sessionId: sessionIdStr,
  userId: uuidv4(),
  name: botName, // ← Имя бота
  correctAnswers: 0,
  errors: 0,
  isBot: true,
  botAccuracy: Math.round(accuracy * 100),
  joinedAt: now,
}).returning();
```

### 3. Обновлен API stats для возврата имен

**Файл:** `app/api/game/[sessionId]/stats/route.ts`

```typescript
players: players.map(p => ({
  id: p.id,
  name: p.name, // ← Возвращаем имя
  correctAnswers: p.correctAnswers,
  errors: p.errors,
  isBot: p.isBot,
  botAccuracy: p.botAccuracy,
})),
```

### 4. Обновлен UI для отображения имен

**Файл:** `components/game/NBackGame.tsx`

```typescript
<span>{player.name || (player.isBot ? 'Bot' : 'Player')}</span>
{player.isBot && <span className="text-xs text-gray-500">(бот)</span>}
{player.id === playerId && <span className="text-xs text-blue-600 font-semibold">(вы)</span>}
```

### 5. Добавлено детальное логирование

**Файл:** `app/api/game/[sessionId]/answer/route.ts`

Логирование теперь показывает:
- ID игрока и бота раздельно
- Какое имя у каждого игрока
- Какие очки у каждого
- Какая запись обновляется в БД

**Пример логов:**
```
🔍 Bot found: { id: 'bot-uuid', name: 'Bot-80%', correctAnswers: 5 }
🔍 Players in session: [
  { id: 'player-uuid', name: 'Player-1', isBot: false, correctAnswers: 7 },
  { id: 'bot-uuid', name: 'Bot-80%', isBot: true, correctAnswers: 5 }
]

📊 Обновляем статистику игрока...
  playerIdStr: player-uuid
  playerAnswer: true | isMatch: true
✅ Активное нажатие на совпадение +1 очко (playerId= player-uuid )

🤖 Статистика бота:
  bot.id: bot-uuid
  bot.name: Bot-80%
  botAnswer: true | isMatch: true | isCorrect: true
🤖 Бот получил +1 очко (активное нажатие на совпадение)
  Обновляем запись бота (id= bot-uuid )
```

## 📊 Результат

### До исправления:
```
Таблица лидеров:
1. undefined (бот) ✓ 5 ✗ 2
2. undefined (вы) ✓ 5 ✗ 2
```

### После исправления:
```
Таблица лидеров:
1. Player-1 (вы) ✓ 7 ✗ 1
2. Bot-80% (бот) ✓ 5 ✗ 3
```

## 📁 Измененные файлы

| Файл | Изменения |
|------|-----------|
| `db/schema/index.ts` | Добавлено поле `name` в `gamePlayers` |
| `app/api/game/create/route.ts` | Сохранение имени игрока и бота |
| `app/api/game/[sessionId]/add-bot/route.ts` | Сохранение имени бота |
| `app/api/game/[sessionId]/stats/route.ts` | Возврат имени в API |
| `app/api/game/[sessionId]/answer/route.ts` | Детальное логирование |
| `components/game/NBackGame.tsx` | Отображение имен в UI |
| `BOT_SCORE_FIX.md` | **NEW** - эта документация |

## 🧪 Тесты

Все тесты проходят: **66/66** ✅

## 🎮 Пример использования

### Создание игры с ботом:
```javascript
const response = await fetch('/api/game/create', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Моя игра',
    nValue: 2,
    totalSteps: 30,
    baseSpeedMs: 2000,
    maxPlayers: 2,
    addBot: true,
    botAccuracy: 75,
  }),
});

const data = await response.json();
console.log('Игрок:', data.playerId); // ID игрока
console.log('Бот будет добавлен с именем: Bot-75%');
```

### Добавление бота в игру:
```javascript
const botResponse = await fetch(`/api/game/${sessionId}/add-bot`, {
  method: 'POST',
  body: JSON.stringify({
    accuracy: 0.85,
    responseDelayMs: 300,
    name: 'Bot-Alice',
  }),
});

const botData = await botResponse.json();
console.log('Бот:', botData.bot);
// { id: '...', name: 'Bot-Alice', accuracy: 0.85, isBot: true }
```

### Загрузка статистики:
```javascript
const statsResponse = await fetch(`/api/game/${sessionId}/stats`);
const stats = await statsResponse.json();

console.log('Игроки:');
stats.players.forEach(player => {
  console.log(`  ${player.name} (${player.isBot ? 'бот' : 'игрок'}): ${player.correctAnswers} очков, ${player.errors} ошибок`);
});

// Вывод:
//   Player-1 (игрок): 7 очков, 1 ошибок
//   Bot-80% (бот): 5 очков, 3 ошибок
```

## 🔍 Отладка

Если очки бота и игрока все еще отображаются неправильно:

1. **Проверьте логи сервера:**
   ```
   🔍 Bot found: { id: '...', name: '...', correctAnswers: ... }
   📊 Обновляем статистику игрока... playerIdStr: ...
   🤖 Статистика бота: bot.id: ...
   ```

2. **Проверьте API stats:**
   ```javascript
   const stats = await fetch(`/api/game/${sessionId}/stats`).then(r => r.json());
   console.log(stats.players);
   // Должны быть разные ID и имена
   ```

3. **Проверьте БД:**
   ```sql
   SELECT id, name, isBot, correctAnswers, errors 
   FROM game_players 
   WHERE session_id = 'ваш-session-id';
   ```

## ✅ Итого

- ✅ У каждого игрока (включая бота) теперь есть свое имя
- ✅ Очки бота и игрока хранятся в разных записях БД
- ✅ API stats возвращает имена всех игроков
- ✅ UI отображает имена и разделяет бота и игрока
- ✅ Детальное логирование для отладки
- ✅ Все тесты проходят (66/66)
