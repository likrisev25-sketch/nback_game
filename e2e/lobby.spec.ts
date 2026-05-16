import { test, expect } from '@playwright/test';

test.describe('Lobby and Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Сначала авторизуемся
    await page.goto('/');
    
    const randomEmail = `test${Date.now()}@example.com`;
    await page.fill('input#reg-name', 'Test Player');
    await page.fill('input#reg-email', randomEmail);
    await page.fill('input#reg-password', 'password123');
    await page.fill('input#reg-confirm', 'password123');
    
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForLoadState('networkidle');
  });

  test('should create a lobby with bot', async ({ page }) => {
    // Прокручиваем до секции создания игры
    await page.click('button:has-text("Начать тренировку")');
    
    // Заполняем форму создания игры
    await page.fill('input[placeholder*="Моя игра"]', 'Test Game');
    
    // Добавляем бота
    await page.check('input#addBot');
    
    // Выбираем точность бота
    await page.selectOption('select', '80'); // 80% accuracy
    
    // Нажимаем кнопку создания
    await page.click('button:has-text("Создать игру")');
    
    // Ждем перехода в лобби
    await page.waitForURL(/\/lobby\//);
    
    // Проверяем, что мы в лобби
    await expect(page.locator('text=Лобби')).toBeVisible();
  });

  test('should list active games', async ({ page }) => {
    // Прокручиваем до секции игр
    await page.click('button:has-text("Начать тренировку")');
    
    // Ждем загрузки списка игр
    await expect(page.locator('text=Активные игры')).toBeVisible();
    
    // Проверяем наличие секции со списком игр
    const gamesSection = page.locator('text=Активные игры');
    await expect(gamesSection).toBeVisible();
  });

  test('should navigate to tournaments', async ({ page }) => {
    // Нажимаем на кнопку турниров
    await page.click('button:has-text("🏆 Турниры")');
    
    // Проверяем переход на страницу турниров
    await page.waitForURL('/tournament');
    await expect(page.locator('text=Турниры')).toBeVisible();
  });
});