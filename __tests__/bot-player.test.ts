/**
 * Тесты для BotPlayer
 */

import { BotPlayer, BotPresets } from '@/lib/bot/BotPlayer';

describe('BotPlayer', () => {
  describe('Создание бота', () => {
    test('должен создать бота с настройками по умолчанию', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'TestBot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });

      expect(bot.id).toBe('bot-1');
      expect(bot.name).toBe('TestBot');
      expect(bot.accuracy).toBe(0.8);
      expect(bot.responseDelayMs).toBe(300);
      expect(bot.currentN).toBe(2);
      expect(bot.stimulusHistory).toEqual([]);
    });

    test('должен ограничить accuracy в пределах 0-1', () => {
      const bot1 = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 1.5,
        responseDelayMs: 300,
      });
      expect(bot1.accuracy).toBe(1);

      const bot2 = new BotPlayer({
        id: 'bot-2',
        name: 'Bot',
        accuracy: -0.5,
        responseDelayMs: 300,
      });
      expect(bot2.accuracy).toBe(0);
    });
  });

  describe('Установка N', () => {
    test('должен установить текущее значение N', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });

      bot.setN(4);
      expect(bot.currentN).toBe(4);
    });
  });

  describe('История стимулов', () => {
    test('должен добавлять стимулы в историю', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });

      bot.addStimulus(1);
      bot.addStimulus(2);
      bot.addStimulus(3);

      expect(bot.stimulusHistory).toEqual([1, 2, 3]);
    });

    test('должен очищать историю', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });

      bot.addStimulus(1);
      bot.addStimulus(2);
      bot.clearHistory();

      expect(bot.stimulusHistory).toEqual([]);
    });
  });

  describe('Определение правильного ответа', () => {
    test('должен вернуть false когда история < N', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });
      bot.setN(3);

      bot.addStimulus(1);
      bot.addStimulus(2);

      const result = bot.getCorrectAnswer();
      expect(result.shouldPress).toBe(false);
      expect(result.isMatch).toBe(false);
    });

    test('должен определить совпадение', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });
      bot.setN(2);

      // История: [1, 2, 1] - текущий стимул 1, N=2 шага назад тоже 1
      bot.addStimulus(1);
      bot.addStimulus(2);
      bot.addStimulus(1);

      const result = bot.getCorrectAnswer();
      expect(result.shouldPress).toBe(true);
      expect(result.isMatch).toBe(true);
    });

    test('должен определить отсутствие совпадения', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });
      bot.setN(2);

      // История: [1, 2, 3] - текущий стимул 3, N=2 шага назад 1
      bot.addStimulus(1);
      bot.addStimulus(2);
      bot.addStimulus(3);

      const result = bot.getCorrectAnswer();
      expect(result.shouldPress).toBe(false);
      expect(result.isMatch).toBe(false);
    });
  });

  describe('Принятие решения', () => {
    test('бот с accuracy=1.0 всегда отвечает правильно', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 1.0,
        responseDelayMs: 300,
      });
      bot.setN(2);

      // Совпадение
      bot.addStimulus(1);
      bot.addStimulus(2);
      bot.addStimulus(1);

      const decision = bot.makeDecision();
      expect(decision.isCorrect).toBe(true);
      expect(decision.shouldPress).toBe(true);
    });

    test('бот с accuracy=0.0 всегда ошибается', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.0,
        responseDelayMs: 300,
      });
      bot.setN(2);

      // Совпадение
      bot.addStimulus(1);
      bot.addStimulus(2);
      bot.addStimulus(1);

      const decision = bot.makeDecision();
      expect(decision.isCorrect).toBe(false);
    });

    test('бот с accuracy=0.5 отвечает правильно примерно в 50% случаев', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.5,
        responseDelayMs: 300,
      });
      bot.setN(2);

      let correctCount = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        bot.clearHistory();
        bot.addStimulus(1);
        bot.addStimulus(2);
        bot.addStimulus(1);

        const decision = bot.makeDecision();
        if (decision.isCorrect) correctCount++;
      }

      // Должно быть примерно 50% (с допуском 5%)
      const accuracy = correctCount / iterations;
      expect(accuracy).toBeGreaterThan(0.45);
      expect(accuracy).toBeLessThan(0.55);
    });
  });

  describe('Задержка ответа', () => {
    test('должен эмулировать задержку', async () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 0.8,
        responseDelayMs: 100,
      });

      const start = Date.now();
      await bot.simulateDelay();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Допуск 10мс
    });
  });

  describe('Статистика', () => {
    test('должен вернуть статистику бота', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'TestBot',
        accuracy: 0.8,
        responseDelayMs: 300,
      });
      bot.setN(3);
      bot.addStimulus(1);
      bot.addStimulus(2);

      const stats = bot.getStats();
      expect(stats.id).toBe('bot-1');
      expect(stats.name).toBe('TestBot');
      expect(stats.accuracy).toBe(0.8);
      expect(stats.currentN).toBe(3);
      expect(stats.historyLength).toBe(2);
    });
  });

  describe('Пресеты ботов', () => {
    test('должен создать легкого бота', () => {
      const config = BotPresets.easy('bot-1');
      expect(config.accuracy).toBe(0.5);
      expect(config.responseDelayMs).toBe(800);
    });

    test('должен создать среднего бота', () => {
      const config = BotPresets.medium('bot-1');
      expect(config.accuracy).toBe(0.75);
      expect(config.responseDelayMs).toBe(500);
    });

    test('должен создать сложного бота', () => {
      const config = BotPresets.hard('bot-1');
      expect(config.accuracy).toBe(0.95);
      expect(config.responseDelayMs).toBe(300);
    });

    test('должен создать кастомного бота', () => {
      const config = BotPresets.custom('bot-1', 0.65, 400, 'CustomBot');
      expect(config.accuracy).toBe(0.65);
      expect(config.responseDelayMs).toBe(400);
      expect(config.name).toBe('CustomBot');
    });
  });

  describe('Интеграционный тест', () => {
    test('полный цикл игры для N=2', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 1.0, // Всегда правильно
        responseDelayMs: 0,
      });
      bot.setN(2);

      const sequence = [1, 2, 3, 1, 2, 3];
      let correctCount = 0;
      let errorCount = 0;

      for (let i = 0; i < sequence.length; i++) {
        bot.addStimulus(sequence[i]);
        const decision = bot.makeDecision();

        if (decision.isCorrect) {
          correctCount++;
        } else {
          errorCount++;
        }
      }

      // При accuracy=1.0 все ответы должны быть правильными
      expect(errorCount).toBe(0);
      expect(correctCount).toBe(sequence.length);
    });

    test('полный цикл игры для N=3', () => {
      const bot = new BotPlayer({
        id: 'bot-1',
        name: 'Bot',
        accuracy: 1.0,
        responseDelayMs: 0,
      });
      bot.setN(3);

      const sequence = [1, 2, 3, 1, 4, 2];
      let correctCount = 0;

      for (let i = 0; i < sequence.length; i++) {
        bot.addStimulus(sequence[i]);
        const decision = bot.makeDecision();
        if (decision.isCorrect) correctCount++;
      }

      expect(correctCount).toBe(sequence.length);
    });
  });
});
