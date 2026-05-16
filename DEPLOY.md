# 🚀 Размещение сайта в интернете

## Вариант 1: Railway.app (Бесплатно, ~$5/мес после лимитов)

### Шаг 1: Регистрация
1. Зайдите на [railway.app](https://railway.app)
2. Нажмите **"Login"** → **"GitHub"**
3. Авторизуйтесь через GitHub

### Шаг 2: Создание проекта
1. Нажмите **"New Project"** → **"Deploy from GitHub repo"**
2. Выберите репозиторий `nback-game`
3. Railway автоматически определит Next.js

### Шаг 3: Настройка переменных окружения
В Railway перейдите во вкладку **"Variables"** и добавьте:

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ваш-проект.railway.app
DATABASE_URL=file:./db.sqlite
BETTER_AUTH_SECRET=ваш-случайный-секрет-минимум-32-символа
```

> **Важно:** Сгенерируйте секрет:
> ```bash
> openssl rand -base64 32
> ```

### Шаг 4: Деплой
1. Нажмите **"Deploy"**
2. Дождитесь завершения (~2-3 минуты)
3. Вкладка **"Settings"** → **"Domains"** → скопируйте URL

### Шаг 5: Сохранение БД
Railway автоматически сохраняет `db.sqlite` внутри контейнера, но для надёжности:
1. Вкладка **"Data"** → **"New Database"** → **"PostgreSQL"**
2. Если нужно — мигрируйте на PostgreSQL (см. раздел ниже)

---

## Вариант 2: Render.com (Бесплатно, но контейнер засыпает)

### Шаг 1: Регистрация
1. Зайдите на [render.com](https://render.com)
2. **"New +"** → **"Web Service"**

### Шаг 2: Подключение репозитория
- **Name:** `nback-game`
- **Environment:** `Docker`
- **Build Command:** `docker build -t nback-game .`
- **Start Command:** `docker run -p 3000:3000 nback-game`
- **Environment Variables:** те же, что для Railway

### Шаг 3: Бесплатный тариф
- Контейнер засыпает после 15 минут бездействия
- Первый запуск после сна ~30 секунд

---

## Вариант 3: VPS (Hetzner, DigitalOcean, ~$4-5/мес)

### Шаг 1: Создание VPS
1. Зарегистрируйтесь на [Hetzner Cloud](https://www.hetzner.com/cloud)
2. Создайте сервер: Ubuntu 22.04, 2 CPU, 4GB RAM (~€4/мес)

### Шаг 2: Установка Docker
```bash
ssh root@ваш-IP-сервера
apt update && apt upgrade -y
apt install docker.io docker-compose -y
```

### Шаг 3: Загрузка кода
```bash
cd /var/www
git clone https://github.com/ваш-пользователь/nback-game.git
cd nback-game
```

### Шаг 4: Настройка
```bash
cp .env.example .env
nano .env
```

Измените:
```
NEXT_PUBLIC_APP_URL=https://ваш-домен.com
DATABASE_URL=file:/var/www/nback-game/db.sqlite
BETTER_AUTH_SECRET=сгенерированный-секрет
```

### Шаг 5: Запуск
```bash
docker-compose up -d --build
```

### Шаг 6: Настройка домена (опционально)
```bash
# Установка Nginx
apt install nginx -y

# Создание конфига
nano /etc/nginx/sites-available/nback-game
```

```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/nback-game /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Шаг 7: SSL (HTTPS) через Let's Encrypt
```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d ваш-домен.com
```

---

## Вариант 4: Vercel (только с PostgreSQL)

Vercel не поддерживает SQLite. Нужна миграция на PostgreSQL:

### Шаг 1: Создание БД в Neon/Supabase
1. Зарегистрируйтесь на [neon.tech](https://neon.tech) (бесплатно)
2. Создайте проект
3. Скопируйте `DATABASE_URL`

### Шаг 2: Обновление кода
```bash
npm install @neondatabase/serverless drizzle-orm/postgres
```

### Шаг 3: Настройка в Vercel
- Подключите GitHub репозиторий
- Добавьте переменные окружения:
  ```
  DATABASE_URL=postgres://user:pass@host:port/db
  BETTER_AUTH_SECRET=ваш-секрет
  ```

---

## 🔧 Миграция SQLite → PostgreSQL (если нужно)

### 1. Установка утилит
```bash
npm install -g drizzle-kit
```

### 2. Создание миграции
```bash
npx drizzle-kit generate --dialect=postgresql
```

### 3. Применение
```bash
npx drizzle-kit migrate
```

---

## 📋 Чек-лист перед запуском

- [ ] Сгенерировать `BETTER_AUTH_SECRET` (минимум 32 символа)
- [ ] Установить `DATABASE_URL` для продакшена
- [ ] Проверить, что `next.config.ts` содержит `output: 'standalone'`
- [ ] Протестировать локально: `docker-compose up`
- [ ] Настроить HTTPS (обязательно для аутентификации)
- [ ] Добавить мониторинг (Railway/Render делают это автоматически)
- [ ] Настроить резервное копирование БД

---

## 🔐 Безопасность

### Обязательно:
1. **Секрет аутентификации** — никогда не используйте пример
2. **HTTPS** — обязательно для работы куки-сессий
3. **Доступ к БД** — ограничьте по IP если возможно
4. **Резервные копии** — настройте автоматический бэкап

### Рекомендации:
- Добавьте `ROBOTS.txt` с `Disallow: /` для приватных проектов
- Используйте `Content-Security-Policy` заголовки
- Регулярно обновляйте зависимости: `npm audit fix`

---

## 🆘 Устранение проблем

### Ошибка: "Container crashed"
- Проверьте логи: `docker logs nback-game`
- Убедитесь, что `BETTER_AUTH_SECRET` >= 32 символа
- Проверьте доступность порта 3000

### Ошибка: "Database locked"
- Убедитесь, что нет нескольких процессов с БД
- Для Railway/Render — используйте PostgreSQL

### Ошибка: "Session cookie not working"
- Убедитесь, что используется HTTPS
- Проверьте `NEXT_PUBLIC_APP_URL` — должен совпадать с доменом

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи деплоя (Railway/Render/VPS)
2. Убедитесь, что все переменные окружения установлены
3. Протестируйте локально через Docker
