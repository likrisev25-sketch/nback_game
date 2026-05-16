# Подключение Neon PostgreSQL

## ✅ Что уже сделано:

1. ✅ Установлен пакет `postgres`
2. ✅ Обновлён `db/db.ts` для PostgreSQL
3. ✅ Обновлён `drizzle.config.ts` для PostgreSQL
4. ✅ Обновлена схема базы данных (`db/schema/index.ts`)
5. ✅ Отключена статическая генерация для динамических страниц

## 🚀 Настройка Neon:

### 1. Получите connection string из Neon

В панели Neon:
1. Откройте ваш проект: https://console.neon.tech/
2. Перейдите в **Dashboard** → **Connection Details**
3. Скопируйте **Connection string** (должен начинаться с `postgresql://` или `postgres://`)

Пример:
```
postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### 2. Добавьте переменную окружения в Vercel

Перейдите на: https://vercel.com/likrisev25-sketchs-projects/nback-game/settings/environment

Добавьте переменную для **Production**, **Preview** и **Development**:

```
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

### 3. Добавьте остальные переменные окружения

В том же месте добавьте:

```
NEXT_PUBLIC_APP_URL=https://nback-game-topaz.vercel.app
BETTER_AUTH_URL=https://nback-game-topaz.vercel.app
BETTER_AUTH_SECRET=<сгенерируйте случайную строку из 32+ символов>
```

**Как сгенерировать секрет:**
```bash
# PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Или используйте: https://generate-secret.vercel.app/32
```

### 4. Примените миграции к базе данных

**Вариант A - Через Vercel CLI (рекомендуется):**

```bash
# Скачать переменные окружения из Vercel
vercel env pull

# Применить миграции
npm run db:push
```

**Вариант B - Через Neon Dashboard:**

1. В панели Neon откройте **SQL Shell**
2. Выполните команду:
```bash
npm run db:push
```

Это создаст все таблицы в базе данных.

### 5. Перераспределите приложение

После настройки всех переменных:

```bash
vercel --prod
```

Или нажмите **Redeploy** в панели Vercel.

## 🧪 Проверка:

После деплоя:
1. Откройте https://nback-game-topaz.vercel.app
2. Зарегистрируйтесь
3. Создайте лобби или турнир
4. Проверьте, что данные сохраняются

## 📝 Примечания:

### Миграции

Если вы измените схему базы данных:
```bash
# Сгенерировать миграцию
npm run db:generate

# Применить миграцию
npm run db:migrate
```

### Работа с базой данных

```bash
# GUI для работы с базой данных
npm run db:studio
```

Откроется веб-интерфейс для просмотра и редактирования данных.

### Отладка

Если есть ошибки подключения:
1. Проверьте, что `DATABASE_URL` правильный
2. Убедитесь, что SSL включён (`?sslmode=require`)
3. Проверьте логи Vercel: https://vercel.com/likrisev25-sketchs-projects/nback-game/deployments

---

## 🎉 Готово!

После настройки ваш проект будет работать с PostgreSQL на Neon!
