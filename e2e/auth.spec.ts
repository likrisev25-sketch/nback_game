import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to register and login', async ({ page }) => {
    // Навигация на главную страницу
    await page.goto('/');
    
    // Проверяем, что видим форму регистрации
    await expect(page.locator('text=Регистрация')).toBeVisible();
    
    // Заполняем форму регистрации
    const randomEmail = `test${Date.now()}@example.com`;
    await page.fill('input#reg-name', 'Test User');
    await page.fill('input#reg-email', randomEmail);
    await page.fill('input#reg-password', 'password123');
    await page.fill('input#reg-confirm', 'password123');
    
    // Нажимаем кнопку регистрации
    await page.click('button:has-text("Зарегистрироваться")');
    
    // Ждем успешной регистрации - страница должна перезагрузиться
    await page.waitForLoadState('networkidle');
    
    // Проверяем, что мы авторизованы - видим имя пользователя
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.goto('/');
    
    // Переключаемся на форму входа
    await page.click('button:has-text("Войти")');
    
    // Заполняем некорректный email
    await page.fill('input#login-email', 'invalid-email');
    await page.fill('input#login-password', 'password123');
    
    // Нажимаем кнопку входа
    await page.click('button:has-text("Войти")');
    
    // Проверяем ошибку валидации
    await expect(page.locator('text=Введите корректный email')).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/');
    
    // Заполняем форму регистрации с разными паролями
    await page.fill('input#reg-name', 'Test User');
    await page.fill('input#reg-email', `test${Date.now()}@example.com`);
    await page.fill('input#reg-password', 'password123');
    await page.fill('input#reg-confirm', 'password456');
    
    // Нажимаем кнопку регистрации
    await page.click('button:has-text("Зарегистрироваться")');
    
    // Проверяем ошибку валидации
    await expect(page.locator('text=Пароли не совпадают')).toBeVisible();
  });
});