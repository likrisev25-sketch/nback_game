# Исправление ошибки 401 при создании лобби

## Проблема
При попытке создать лобби в `LobbyList.tsx` возвращалась ошибка 401 "Необходимо авторизоваться для создания лобби", даже если пользователь был авторизован.

## Причина
В компоненте `LobbyList.tsx` запросы к API отправлялись без параметра `credentials: 'include'`, поэтому куки сессии не передавались на сервер.

## Исправление
Добавлен параметр `credentials: 'include'` в следующие запросы в `components/lobby/LobbyList.tsx`:

1. `POST /api/lobby/create` - создание лобби
2. `POST /api/lobby/[lobbyId]/join` - присоединение к лобби

## Изменения
```diff
const response = await fetch('/api/lobby/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
+ credentials: 'include',
  body: JSON.stringify({
    // ...
  }),
});
```

```diff
const response = await fetch(`/api/lobby/${lobbyId}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
+ credentials: 'include',
});
```

## Проверка
1. Авторизуйтесь в приложении
2. Перейдите на страницу лобби
3. Попробуйте создать лобби
4. Ошибка 401 больше не должна появляться

## Примечания
- tRPC запросы в `SimpleLobby.tsx` уже правильно настроены - они передают куки через заголовок `cookie: document.cookie`
- Страница входа (`/login`) уже использует `credentials: 'include'`
- Другие API маршруты, требующие авторизации, также должны использовать `credentials: 'include'` при отправке запросов с клиента