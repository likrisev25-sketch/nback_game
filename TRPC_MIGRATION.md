# 🔄 Миграция на tRPC для работы с лобби

## 📋 Проблема

При использовании прямых API вызовов (`/api/lobby/*`) возникали проблемы с авторизацией:
- Ошибка 401 "Необходимо авторизоваться для создания лобби"
- Куки сессии не всегда корректно передавались
- Дублирование логики проверки авторизации

## ✅ Решение

Переключили компонент `LobbyList.tsx` на использование tRPC вместо прямых REST API вызовов.

### Что изменилось

#### 1. Импорт tRPC клиента
```typescript
import { trpc } from '@/lib/trpc-client';
```

#### 2. Использование tRPC хуков

**Вместо:**
```typescript
const response = await fetch('/api/lobby/list');
const data = await response.json();
setLobbies(data.lobbies);
```

**Теперь:**
```typescript
const listLobbies = trpc.lobby.listLobbies.useQuery(undefined, {
  refetchInterval: 10000,
});

useEffect(() => {
  if (listLobbies.data) {
    setLobbies(listLobbies.data);
  }
}, [listLobbies.data]);
```

**Вместо:**
```typescript
const response = await fetch('/api/lobby/create', {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({ /* ... */ }),
});
```

**Теперь:**
```typescript
const createLobbyMutation = trpc.lobby.createLobby.useMutation({
  onSuccess: (data) => {
    router.push(`/lobby/${data.lobbyId}`);
  },
  onError: (error) => {
    setError(error.message);
  },
});

createLobbyMutation.mutate({
  gameId: 'default',
  name: formData.name,
  // ...
});
```

### Преимущества tRPC подхода

1. **Автоматическая передача кук** - tRPC клиент автоматически передаёт куки через заголовок `cookie: document.cookie`
2. **Типобезопасность** - автоматическая типизация входных и выходных данных
3. **Поддержка гостей** - tRPC роутер уже поддерживает создание лобби без авторизации
4. **Единая точка входа** - все API вызовы через `/api/trpc`
5. **Обработка ошибок** - централизованная обработка ошибок через tRPC
6. **Оптимизация** - batch запросы и кэширование через React Query

### Изменения в файлах

#### `components/lobby/LobbyList.tsx`
- ✅ Добавлен импорт `trpc` из `@/lib/trpc-client`
- ✅ Добавлены tRPC хуки: `listLobbies`, `createLobbyMutation`, `joinLobbyMutation`
- ✅ Удалены прямые `fetch` вызовы к `/api/lobby/*`
- ✅ Убрана проверка авторизации (tRPC поддерживает гостей)
- ✅ Обновлена кнопка создания лобби для отображения статуса `isPending`

#### `server/trpc/routers/lobby.ts`
- ✅ Уже поддерживает гостей через `ctx.user?.id || \`guest_${uuidv4()}\``
- ✅ Все процедуры используют `publicProcedure` (доступны без авторизации)
- ✅ Корректная обработка ошибок

#### `lib/trpc-provider.tsx`
- ✅ Уже настроен на передачу кук: `cookie: document.cookie`
- ✅ Автоматическая аутентификация через сессионные куки

## 🧪 Тестирование

### Проверка работы без авторизации (гость)
1. Откройте приложение в режиме инкогнито
2. Перейдите на страницу лобби
3. Попробуйте создать лобби
4. ✅ Должно успешно создаться с `guest_` префиксом

### Проверка работы с авторизацией
1. Войдите в систему
2. Перейдите на страницу лобби
3. Создайте лобби
4. ✅ Должно успешно создаться с вашим userId

### Проверка присоединения к лобби
1. Создайте лобби (как гость или авторизованный пользователь)
2. Откройте вторую вкладку
3. Присоединитесь к лобби
4. ✅ Оба игрока должны видеть друг друга

## 📊 Сравнение подходов

### До миграции (REST API)
```
❌ Прямые fetch вызовы
❌ Ручная передача credentials: 'include'
❌ Дублирование проверки авторизации
❌ Ошибки 401 при проблемах с сессией
❌ Нет типобезопасности
```

### После миграции (tRPC)
```
✅ Единый tRPC клиент
✅ Автоматическая передача кук
✅ Поддержка гостей из коробки
✅ Типобезопасность
✅ Обработка ошибок через TRPCError
✅ Кэширование через React Query
```

## 🔄 Миграция других компонентов

Если у вас есть другие компоненты, использующие прямые API вызовы, рекомендуется переключить их на tRPC:

### Пример миграции

**До:**
```typescript
const response = await fetch('/api/lobby/123/join', {
  method: 'POST',
  credentials: 'include',
});
```

**После:**
```typescript
const joinMutation = trpc.lobby.joinLobby.useMutation();
joinMutation.mutate({ lobbyId: '123' });
```

## 🛠️ Настройка tRPC для новых роутеров

Если вы создаёте новый роутер, добавьте его в `server/trpc/index.ts`:

```typescript
import { router } from './trpc';
import { lobbyRouter } from './routers/lobby';
import { newRouter } from './routers/new'; // Новый роутer

export const appRouter = router({
  lobby: lobbyRouter,
  new: newRouter, // Добавляем новый роутер
});
```

## 📝 Примечания

- tRPC роутер использует `publicProcedure` для всех операций с лобби
- Для операций, требующих авторизации (например, `setReady`), используется проверка `ctx.user?.id`
- Гости получают временный `userId` с префиксом `guest_`
- Сессионные куки автоматически передаются через tRPC клиент

## ✅ Чек-лист успешной миграции

- [x] `LobbyList.tsx` переключен на tRPC
- [x] Удалены прямые fetch вызовы к `/api/lobby/*`
- [x] Добавлены tRPC хуки (useQuery, useMutation)
- [x] Протестировано создание лобби без авторизации
- [x] Протестировано создание лобби с авторизацией
- [x] Протестировано присоединение к лобби
- [x] Обновлена документация

---

**Дата миграции:** 2026-05-27  
**Версия:** 2.0.0  
**Статус:** ✅ Готово