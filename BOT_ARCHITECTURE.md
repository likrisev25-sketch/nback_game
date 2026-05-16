# Архитектура бота - Независимая игра

## 🎯 Проблема (исправлена)

Раньше бот:
1. Отвечал внутри API ответа игрока (`/api/game/[sessionId]/answer`)
2. Использовал `isMatch` ИГРОКА вместо своего собственного
3. Не играл самостоятельно - только когда игрок нажимал кнопку

## ✅ Новая архитектура

### Отдельный API для бота

**Файл:** `app/api/game/[sessionId]/bot-move/route.ts`

```
POST /api/game/[sessionId]/bot-move
Body: { stepNumber: number }
Response: { 
  success: true,
  botAnswer: boolean,      // нажал ли бот кнопку
  isCorrect: boolean,      // правильный ли ответ
  isMatch: boolean,        // было ли совпадение
  correctAnswers: number,  // очки бота
  errors: number,          // ошибки бота
  duplicate: boolean       // уже отвечал?
}
```

### Как это работает

```
Игровой цикл (каждый шаг):

1. Показываем позицию игроку
   ↓
2. Вызываем API бота (/api/game/[sessionId]/bot-move)
   - Бот вычисляет совпадение НЕЗАВИСИМО
   - Бот принимает решение на основе botAccuracy
   - Сохраняет свой ход в БД
   - Обновляет свою статистику
   ↓
3. Ждем ответа игрока (или таймаут)
   ↓
4. Переход к следующему шагу
```

### Ключевые изменения

#### 1. Бот играет НЕЗАВИСИМО

**Раньше:**
```
Игрок нажимает → API answer → бот отвечает (использует isMatch игрока)
```

**Теперь:**
```
Каждый шаг:
  → API bot-move (бот отвечает сам)
  → Игрок отвечает (если хочет)
```

#### 2. Бот вычисляет совпадение самостоятельно

```typescript
// Бот вычисляет РЕАЛЬНОЕ совпадение
let botRealIsMatch = false;
if (stepNumber >= nValue) {
  botRealIsMatch = positions[stepNumber] === positions[stepNumber - nValue];
}

// Бот принимает решение на основе botAccuracy
const random = Math.random() * 100;
const shouldAnswerCorrectly = random < bot.botAccuracy;

// Решение
const botAnswer = shouldAnswerCorrectly ? botRealIsMatch : !botRealIsMatch;
```

#### 3. Бот сохраняет свой собственный ход

```typescript
await db.insert(gameMoves).values({
  id: uuidv4(),
  sessionId: sessionIdStr,
  playerId: bot.id,           // ← ID бота
  position: positions[stepNumber],
  stepNumber,
  isMatch: botRealIsMatch,    // ← СОБСТВЕННОЕ isMatch
  playerAnswer: botAnswer,    // ← СОБСТВЕННОЕ решение
  isCorrect: botIsCorrect,
  createdAt: now,
});
```

#### 4. Бот обновляет только свою статистику

```typescript
// Очки бота
if (botAnswer === true && botRealIsMatch === true) {
  await db.update(gamePlayers)
    .set({ correctAnswers: sql`${gamePlayers.correctAnswers} + 1` })
    .where(eq(gamePlayers.id, bot.id)); // ← Только бот
}

// Ошибки бота
if (!botIsCorrect) {
  await db.update(gamePlayers)
    .set({ errors: sql`${gamePlayers.errors} + 1` })
    .where(eq(gamePlayers.id, bot.id)); // ← Только бот
}
```

## 📊 Пример работы

### Последовательность: [1, 2, 1, 3, 2, 1], N=2

**Совпадения:**
- Шаг 2: position=1, N=2 назад position=1 → **совпадение**
- Шаг 4: position=2, N=2 назад position=1 → нет
- Шаг 5: position=1, N=2 назад position=3 → нет

### Игрок (нажимает на шаге 2):
| Шаг | Позиция | Совпадение? | Игрок | Очки | Ошибки |
|-----|---------|-------------|-------|------|--------|
| 0 | 1 | Нет | Не нажал | 0 | 0 |
| 1 | 2 | Нет | Не нажал | 0 | 0 |
| 2 | 1 | **Да** | **Нажал** ✅ | **+1** | 0 |
| 3 | 3 | Нет | Не нажал | 0 | 0 |
| 4 | 2 | Нет | Не нажал | 0 | 0 |
| 5 | 1 | Нет | Не нажал | 0 | 0 |
| **Итого** | | | | **1** | **0** |

### Бот (accuracy=80%, нажимает на шагах 2 и 4):
| Шаг | Позиция | Совпадение? | Бот | Очки | Ошибки |
|-----|---------|-------------|-----|------|--------|
| 0 | 1 | Нет | Не нажал | 0 | 0 |
| 1 | 2 | Нет | Не нажал | 0 | 0 |
| 2 | 1 | **Да** | **Нажал** ✅ | **+1** | 0 |
| 3 | 3 | Нет | Не нажал | 0 | 0 |
| 4 | 2 | Нет | **Нажал** ❌ | 0 | **+1** |
| 5 | 1 | Нет | Не нажал | 0 | 0 |
| **Итого** | | | | **1** | **1** |

### Результат:
```
Таблица лидеров:
1. Player-1 (вы) ✓ 1 ✗ 0
2. Bot-80% (бот) ✓ 1 ✗ 1
```

## 📁 Измененные файлы

| Файл | Изменения |
|------|-----------|
| `app/api/game/[sessionId]/bot-move/route.ts` | **NEW** - отдельный API для бота |
| `app/api/game/[sessionId]/answer/route.ts` | Убран код бота (бот больше не здесь) |
| `components/game/NBackGame.tsx` | Добавлен вызов API бота на каждом шаге |

## 🧪 Тесты

Все тесты проходят: **66/66** ✅

## 🎮 Как использовать

### 1. Создать игру с ботом:
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
    botAccuracy: 80,
  }),
});
```

### 2. Бот играет автоматически
На каждом шаге клиент вызывает:
```javascript
fetch(`/api/game/${sessionId}/bot-move`, {
  method: 'POST',
  body: JSON.stringify({ stepNumber: currentStep }),
});
```

### 3. Получить статистику:
```javascript
const stats = await fetch(`/api/game/${sessionId}/stats`).then(r => r.json());
console.log(stats.players);
// [
//   { name: 'Player-1', correctAnswers: 5, errors: 2, isBot: false },
//   { name: 'Bot-80%', correctAnswers: 4, errors: 3, isBot: true }
// ]
```

## 🔍 Отладка

### Логи сервера (бот):
```
🤖 [bot-move] Шаг 2 сессия abc-123
🤖 [bot-move] Бот вычисляет:
  stepNumber: 2
  positions[ 2 ]: 1
  positions[ 0 ]: 1
  botRealIsMatch: true
🤖 [bot-move] random=45.23 | accuracy=80 | correct=true
🤖 [bot-move] botAnswer=true | botIsCorrect=true
✅ [bot-move] Ход бота сохранён
🤖 [bot-move] Бот получил +1 очко
```

### Логи сервера (игрок):
```
🎯 START: Обработка ответа для sessionId: abc-123
📥 Body: { playerId: player-uuid, position: 1, stepNumber: 2, playerAnswer: true }
✅ Проверка ответа: { isCorrect: true, isMatch: true }
✅ Активное нажатие на совпадение +1 очко (playerId= player-uuid )
```

## ✅ Итого

- ✅ Бот играет НЕЗАВИСИМО от игрока
- ✅ Бот вычисляет совпадение самостоятельно
- ✅ Бот сохраняет свои ходы отдельно
- ✅ Бот обновляет только свою статистику
- ✅ Очки бота и игрока раздельные
- ✅ accuracy бота работает корректно
- ✅ Все тесты проходят (66/66)
