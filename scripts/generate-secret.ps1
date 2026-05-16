# Генерация безопасного секрета для аутентификации (PowerShell)

Write-Host "🔐 Генерация BETTER_AUTH_SECRET..." -ForegroundColor Cyan

# Генерация 32-символьного случайного строкового значения
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
$SECRET = [System.Convert]::ToBase64String($bytes) -replace '[^a-zA-Z0-9]', '' | Select-Object -First 32

Write-Host "================================" -ForegroundColor Yellow
Write-Host "BETTER_AUTH_SECRET=$SECRET" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Добавьте это значение в .env.local или в переменные окружения вашего хостинга" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  НЕ КОПИРУЙТЕ ЭТОТ ФАЙЛ В РЕПОЗИТОРИЙ!" -ForegroundColor Red
