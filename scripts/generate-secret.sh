#!/bin/bash

# Генерация безопасного секрета для аутентификации
echo "🔐 Генерация BETTER_AUTH_SECRET..."

if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32 | tr -d '=+' | head -c 32)
elif command -v shuf &> /dev/null; then
    SECRET=$(shuf -v -n 32 -e {a..z} {A..Z} {0..9} | tr -d '\n')
else
    echo "⚠️ openssl и shuf не найдены, генерируем простой секрет"
    SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
fi

echo "================================"
echo "BETTER_AUTH_SECRET=$SECRET"
echo "================================"
echo ""
echo "Добавьте это значение в .env.local или в переменные окружения вашего хостинга"
echo ""
echo "⚠️  НЕ КОПИРУЙТЕ ЭТОТ ФАЙЛ В РЕПОЗИТОРИЙ!"
