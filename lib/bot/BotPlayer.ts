// Файл: BotPlayer.ts
/**
 * Класс BotPlayer - модель бота для N-back игры
 * 
 * Бот действует по правилам:
 * - Получает стимулы (позиции) от сервера
 * - Хранит историю стимулов
 * - Сравнивает текущий стимул с позицией N шагов назад
 * - Принимает решение на основе accuracy (точности)
 * - accuracy = 1.0 (100%) - всегда правильно
 * - accuracy = 0.0 (0%) - всегда ошибается
 */

export interface BotConfig {
  id: string;
  name: string;
  accuracy: number; // 0.0 - 1.0
  responseDelayMs: number;
}

export interface BotDecision {
  shouldPress: boolean;
  isCorrect: boolean;
  isMatch: boolean;
  confidence: number;
}

export class BotPlayer {
  id: string;
  name: string;
  accuracy: number;
  responseDelayMs: number;
  currentN: number;
  stimulusHistory: number[];

  constructor(config: BotConfig) {
    this.id = config.id;
    this.name = config.name;
    this.accuracy = Math.max(0, Math.min(1, config.accuracy)); // Ограничиваем 0-1
    this.responseDelayMs = config.responseDelayMs;
    this.currentN = 2; // Значение по умолчанию
    this.stimulusHistory = [];
  }

  /**
   * Установить текущее значение N
   */
  setN(n: number): void {
    this.currentN = n;
  }

  /**
   * Добавить стимул в историю
   */
  addStimulus(position: number): void {
    this.stimulusHistory.push(position);
  }

  /**
   * Очистить историю стимулов (для нового раунда)
   */
  clearHistory(): void {
    this.stimulusHistory = [];
  }

  /**
   * Определить правильный ответ для текущего стимула
   * @returns { shouldPress: boolean, isMatch: boolean }
   */
  getCorrectAnswer(): { shouldPress: boolean; isMatch: boolean } {
    const historyLength = this.stimulusHistory.length;
    
    // Если история меньше или равна N - сравнения нет, правильный ответ = не нажимать
    // Например, при N=2 нужно минимум 3 стимула: [0, 1, 2] где 2 сравнивается с 0
    if (historyLength <= this.currentN) {
      return { shouldPress: false, isMatch: false };
    }

    // Сравниваем текущий стимул с позицией N шагов назад
    // currentN=2: текущий (индекс 2) сравнивается с (индекс 0) = 2 - 2 = 0
    const currentStimulus = this.stimulusHistory[historyLength - 1];
    const nStepsBackStimulus = this.stimulusHistory[historyLength - 1 - this.currentN];
    const isMatch = currentStimulus === nStepsBackStimulus;

    return { shouldPress: isMatch, isMatch };
  }

  /**
   * Принять решение с учетом точности бота
   * @returns BotDecision - решение бота
   */
  makeDecision(): BotDecision {
    const { shouldPress: correctAnswer, isMatch } = this.getCorrectAnswer();
    
    // Генерируем случайное число 0-1
    const random = Math.random();
    
    // Если random < accuracy - бот действует правильно
    // Если random >= accuracy - бот действует ошибочно (наоборот)
    const botWillActCorrectly = random < this.accuracy;
    
    const shouldPress = botWillActCorrectly ? correctAnswer : !correctAnswer;
    const isCorrect = shouldPress === correctAnswer;

    return {
      shouldPress,
      isCorrect,
      isMatch,
      confidence: this.accuracy,
    };
  }

  /**
   * Симулировать задержку ответа
   */
  async simulateDelay(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, this.responseDelayMs);
    });
  }

  /**
   * Получить статистику бота
   */
  getStats(): {
    id: string;
    name: string;
    accuracy: number;
    currentN: number;
    historyLength: number;
  } {
    return {
      id: this.id,
      name: this.name,
      accuracy: this.accuracy,
      currentN: this.currentN,
      historyLength: this.stimulusHistory.length,
    };
  }
}

/**
 * Фабрика для создания ботов с разными уровнями сложности
 */
export const BotPresets = {
  easy: (id: string, name?: string): BotConfig => ({
    id,
    name: name || 'Bot-Novice',
    accuracy: 0.5,
    responseDelayMs: 800,
  }),
  medium: (id: string, name?: string): BotConfig => ({
    id,
    name: name || 'Bot-Pro',
    accuracy: 0.75,
    responseDelayMs: 500,
  }),
  hard: (id: string, name?: string): BotConfig => ({
    id,
    name: name || 'Bot-Master',
    accuracy: 0.95,
    responseDelayMs: 300,
  }),
  custom: (id: string, accuracy: number, responseDelayMs: number, name?: string): BotConfig => ({
    id,
    name: name || `Bot-${Math.round(accuracy * 100)}%`,
    accuracy,
    responseDelayMs,
  }),
};
