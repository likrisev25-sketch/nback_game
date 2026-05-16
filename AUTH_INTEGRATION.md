# Система аутентификации NBack Game

## Обзор

Полная интеграция Better Auth в приложение NBack Game с **обязательной регистрацией**:
- ✅ Только регистрация/вход (гостевой режим отключён)
- ✅ Landing page с формами авторизации при первом входе
- ✅ Защищённых маршрутов (profile, leaderboard)
- ✅ Сохранения статистики игр с привязкой к пользователю
- ✅ Личного кабинета с историей игр
- ✅ Таблицы лидеров

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Аутентификация | Better Auth 1.6.9 |
| База данных | SQLite + Drizzle ORM 0.45.2 |
| Сессии | HTTP-only cookies (автоматически) |
| Валидация | Zod |
| UI компоненты | React 19 + Tailwind CSS 4.x |

## Структура файлов

```
nback-game/
├── components/auth/
│   ├── LoginForm.tsx          # Форма входа
│   ├── RegisterForm.tsx       # Форма регистрации
│   ├── LandingAuth.tsx        # Стартовая страница (регистрация/вход)
│   ├── LogoutButton.tsx       # Кнопка выхода
│   ├── UserMenu.tsx          # Выпадающее меню пользователя
│   ├── AuthModal.tsx         # Модальное окно авторизации
│   ├── AuthGuard.tsx         # HOC для защиты контента
│   └── AuthUrlHandler.tsx    # Обработчик URL параметров
├── lib/
│   ├── auth-client.ts        # Better Auth клиент
│   └── session.ts            # Утилиты для работы с сессиями
├── app/
│   ├── profile/page.tsx      # Личный кабинет (только авторизованные)
│   ├── leaderboard/page.tsx  # Таблица лидеров (публичная)
│   ├── page.tsx              # Главная: LandingAuth | Игра
│   └── layout.tsx            # С Header компонентом
├── middleware.ts             # Middleware для защиты /profile
└── server/auth.ts            # Better Auth конфигурация
```

## Основные компоненты

### 1. LoginForm.tsx
Форма входа с email и паролем.
- Валидация через Zod
- Обработка ошибок
- Авто-вход через Better Auth

```tsx
<LoginForm onSuccess={() => console.log('Logged in')} />
```

### 2. RegisterForm.tsx
Форма регистрации с подтверждением пароля.
- Валидация пароля (мин. 8 символов)
- Проверка совпадения паролей
- Автоматический вход после регистрации

```tsx
<RegisterForm onSuccess={() => console.log('Registered')} />
```

### 3. AuthModal.tsx
Модальное окно с переключением между входом и регистрацией.

```tsx
<AuthModal isOpen={true} onClose={() => setOpen(false)} initialMode="login" />
```

### 4. LandingAuth.tsx
Стартовая страница с обязательной регистрацией/входом. Красивый градиентный фон с анимированными элементами.

```tsx
<LandingAuth onAuthSuccess={() => router.push('/')} />
```

### 5. AuthGuard.tsx
Защищает контент от неавторизованных пользователей.

```tsx
// Как компонент
<AuthGuard>
  <PrivateContent />
</AuthGuard>

// Как HOC
const ProtectedPage = withAuth(MyPage);
```

### 5. LogoutButton.tsx
Кнопка выхода с очисткой сессии.

```tsx
<LogoutButton />
```

### 6. AuthUrlHandler.tsx
Обработчик URL параметров для редиректа после защиты маршрутов.

### 7. UserMenu.tsx
Выпадающее меню с профилем и выходом.

```tsx
<UserMenu />
```

## API Endpoints

### `/api/game/create`
Создание игры с привязкой к пользователю.

**Request:**
```json
{
  "name": "Моя игра",
  "nValue": 2,
  "maxPlayers": 2,
  "addBot": true,
  "botAccuracy": 80,
  "playerName": "Имя игрока"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid...",
  "playerId": "uuid..."
}
```

### `/api/game/join`
Присоединение к существующей игре.

**Request:**
```json
{
  "sessionId": "uuid...",
  "playerName": "Имя игрока"
}
```

### `/api/game/stats`
Статистика игрока (требует авторизации).

**Response:**
```json
{
  "totalGames": 10,
  "totalCorrect": 250,
  "totalErrors": 50,
  "accuracy": 83
}
```

## Защищённые маршруты

### `/profile`
Личный кабинет пользователя:
- Информация о пользователе
- История игр
- Общая статистика (точность, количество игр)

**Доступ:** Только авторизованные пользователи

### `/leaderboard`
Таблица лидеров:
- Топ игроков по очкам
- Топ игроков по точности
- Фильтр по минимальному количеству игр (5+)

**Доступ:** Публичный (доступен всем)

## Middleware

`middleware.ts` защищает маршрут `/profile`:
- `/profile` — требует авторизации (редирект на `/`)
- `/` — обрабатывается в `page.tsx` (LandingAuth для гостей)
- `/leaderboard` — публичный

```typescript
// Конфигурация middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

## Работа с сессиями

### Клиент (React компоненты)

```tsx
import { useSession } from '@/lib/auth-client';

function MyComponent() {
  const { data: session, isPending } = useSession();
  
  if (isPending) return <Spinner />;
  if (!session?.user) return <LoginPrompt />;
  
  return <div>Привет, {session.user.name}!</div>;
}
```

### Сервер (API Routes)

```tsx
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  const userId = session?.user?.id; // или null для гостей
  
  // Сохраняем игру с userId
  await db.insert(gamePlayers).values({
    userId: userId || uuidv4(), // Guest fallback
    // ...
  });
}
```

## Гостевой режим

**Отключён.** Все пользователи должны зарегистрироваться или войти перед началом игры.

### Flow авторизации:
1. **Новый пользователь** → `/` → `LandingAuth` → Регистрация → Вход в игру
2. **Существующий пользователь** → `/` → `LandingAuth` → Вход → Игра
3. **После входа** → сессия в cookies → автоматический вход при следующем посещении

## Валидация форм (Zod)

### Логин
```typescript
const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
```

### Регистрация
```typescript
const registerSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});
```

## Интеграция с игрой

### Главная страница (app/page.tsx)

```tsx
// Неавторизован → LandingAuth
if (!session?.user) {
  return <LandingAuth />;
}

// Авторизован → Игровое меню
return <GameMenu />;
```

### Создание игры
```tsx
const playerName = session?.user?.name || session?.user?.email?.split('@')[0];

const createSession = useCallback(async (gameData) => {
  const response = await fetch('/api/game/create', {
    method: 'POST',
    body: JSON.stringify({
      ...gameData,
      userId: session?.user?.id, // Привязка к пользователю
      playerName,
    }),
  });
  // ...
}, [session]);
```

### Завершение игры
```tsx
const handleGameComplete = useCallback((correctAnswers, errors) => {
  fetch('/api/game/complete', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: currentSessionId,
      playerId: currentPlayerId,
      correctAnswers,
      errors,
    }),
  });
}, [currentSessionId, currentPlayerId]);
```

## База данных

### Существующие таблицы (Better Auth)
- `users` — пользователи
- `sessions` — сессии
- `accounts` — OAuth аккаунты
- `verifications` — верификации email

### Игровые таблицы (Drizzle)
- `game_sessions` — игровые сессии
- `game_players` — игроки (с userId)
- `game_moves` — ходы игроков
- `sequences` — последовательности позиций

## Архитектура аутентификации

```
┌─────────────────────────────────────────────┐
│  Пользователь заходит на /                    │
└──────────────┬────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  sessionLoading? → Показать спиннер         │
│  !session?.user? → LandingAuth              │
│  session?.user?  → GameMenu                 │
└──────────────┬────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  LandingAuth:                               │
│  ┌─────────────┐  ┌─────────────┐          │
│  │   Вход      │  │ Регистрация │          │
│  │ LoginForm   │  │ RegisterForm│          │
│  └──────┬──────┘  └──────┬──────┘          │
│         │                │                  │
│         └────────────────┘                  │
│              │                              │
│              ▼                              │
│    authClient.signIn.email()               │
│    authClient.signUp.email()               │
│              │                              │
│              ▼                              │
│    Better Auth → Cookies → Обновление      │
│    useSession() → GameMenu                 │
└─────────────────────────────────────────────┘
```

```bash
## Запуск приложения

```bash
# Установка зависимостей
npm install

# Миграции БД
npm run db:migrate

# Запуск разработки
npm run dev

# Сборка
npm run build

# Продакшен
npm start
```
```

## Переменные окружения

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key
DATABASE_URL=file:./dev.db

# Приложение
BASE_URL=http://localhost:3000
```

## TODO (опционально)

- [ ] Перенос гостевой статистики при входе
- [ ] OAuth провайдеры (Google, GitHub)
- [ ] Восстановление пароля
- [ ] Подтверждение email
- [ ] Двухфакторная аутентификация
- [ ] Уведомления о результатах игр
- [ ] Экспорт статистики

## Поддержка

При возникновении проблем:
1. Проверьте `.env` файл
2. Запустите миграции: `npm run db:migrate`
3. Очистите кэш: `rm -rf .next`
4. Перезапустите dev сервер

---

**Версия:** 1.0.0  
**Дата:** 2024  
**Стек:** Next.js 16 + Better Auth 1.6.9 + Drizzle ORM 0.45.2
