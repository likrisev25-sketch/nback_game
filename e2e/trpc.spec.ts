import { test, expect } from '@playwright/test';

test.describe('tRPC Integration', () => {
  test('should create game session via tRPC', async ({ page }) => {
    // Переходим на страницу
    await page.goto('/');
    
    // Авторизуемся
    const randomEmail = `test${Date.now()}@example.com`;
    await page.fill('input#reg-name', 'Test User');
    await page.fill('input#reg-email', randomEmail);
    await page.fill('input#reg-password', 'password123');
    await page.fill('input#reg-confirm', 'password123');
    await page.click('button:has-text("Зарегистрироваться")');
    await page.waitForLoadState('networkidle');
    
    // Прокручиваем до создания игры
    await page.click('button:has-text("Начать тренировку")');
    
    // Создаем игру
    await page.fill('input[placeholder*="Моя игра"]', 'tRPC Test Game');
    await page.click('button:has-text("Создать игру")');
    
    // Ждем создания и проверяем, что игра создана
    await page.waitForTimeout(2000);
    
    // Проверяем, что мы в лобби (создание игры прошло успешно)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/lobby\//);
  });

  test('should get game list via API', async ({ request }) => {
    // Прямой запрос к API для проверки tRPC
    const response = await request.get('http://localhost:3000/api/game/list');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('games');
    expect(Array.isArray(data.games)).toBeTruthy();
  });

  test('should handle game creation via API', async ({ request }) => {
    // Создаем игру через API
    const response = await request.post('http://localhost:3000/api/game/create', {
      data: {
        name: 'API Test Game',
        nValue: 3,
        totalSteps: 30,
        baseSpeedMs: 2000,
        maxPlayers: 2,
        addBot: false,
      },
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('sessionId');
    expect(data).toHaveProperty('playerId');
  });
});