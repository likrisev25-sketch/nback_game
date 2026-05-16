/**
 * Тесты для бизнес-логики игры N-back
 * 
 * Тестируем:
 * - Генерацию последовательности
 * - Проверку ответов игрока
 * - Механику влияния ошибок на скорость
 */

// Импортируем функции для тестирования
// (будем выносить их в отдельный модуль для удобства тестирования)

interface TestResult {
  isCorrect: boolean;
  isMatch: boolean;
}

/**
 * Проверяет ответ игрока в игре N-back
 * 
 * @param position - Текущая позиция (0-8)
 * @param stepNumber - Номер шага в последовательности
 * @param sequence - Полная последовательность позиций
 * @param playerAnswer - Ответ игрока (true - нажал кнопку, false - не нажал)
 * @param nValue - Значение N для N-back
 * @returns Объект с результатом проверки
 */
function checkNBackAnswer(
  position: number,
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): TestResult {
  // Проверяем, было ли это совпадение
  const isMatch = stepNumber >= nValue && sequence[stepNumber] === sequence[stepNumber - nValue];
  
  // Проверяем правильность ответа
  const isCorrect = playerAnswer === isMatch;
  
  return { isCorrect, isMatch };
}

/**
 * Генерирует случайную последовательность для N-back
 * 
 * @param totalSteps - Общее количество шагов
 * @param nValue - Значение N для N-back
 * @param gridSize - Размер сетки (по умолчанию 9 для 3×3)
 * @returns Массив позиций
 */
function generateNBackSequence(
  totalSteps: number,
  nValue: number = 3,
  gridSize: number = 9
): number[] {
  const positions: number[] = [];
  
  for (let i = 0; i < totalSteps; i++) {
    // С вероятностью 30% повторяем позицию из N шагов назад
    if (i >= nValue && Math.random() < 0.3) {
      positions.push(positions[i - nValue]);
    } else {
      // Иначе случайная позиция
      positions.push(Math.floor(Math.random() * gridSize));
    }
  }
  
  return positions;
}

/**
 * Рассчитывает новую скорость на основе количества ошибок
 * 
 * @param currentSpeed - Текущая скорость в мс
 * @param errorCount - Количество ошибок игрока
 * @returns Новая скорость (уменьшается на 10% каждые 3 ошибки)
 */
function calculateNewSpeed(currentSpeed: number, errorCount: number): number {
  // Каждые 3 ошибки увеличивают скорость (уменьшаем время)
  const errorGroups = Math.floor(errorCount / 3);
  const newSpeed = currentSpeed * Math.pow(0.9, errorGroups);
  
  // Минимальная скорость - 500мс
  return Math.max(500, Math.floor(newSpeed));
}

describe('N-back Game Logic', () => {
  
  describe('Генерация последовательности', () => {
    test('должна создавать последовательность нужной длины', () => {
      const sequence = generateNBackSequence(30, 3);
      expect(sequence).toHaveLength(30);
    });

    test('должна генерировать только допустимые позиции (0-8)', () => {
      const sequence = generateNBackSequence(100, 3);
      sequence.forEach(pos => {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(8);
      });
    });

    test('должна иногда генерировать совпадения', () => {
      // Запускаем несколько раз, чтобы гарантировать наличие совпадений
      let hasMatch = false;
      for (let i = 0; i < 10; i++) {
        const sequence = generateNBackSequence(50, 3);
        for (let j = 3; j < sequence.length; j++) {
          if (sequence[j] === sequence[j - 3]) {
            hasMatch = true;
            break;
          }
        }
        if (hasMatch) break;
      }
      expect(hasMatch).toBe(true);
    });

    test('должна правильно работать с разными значениями N', () => {
      const sequence1 = generateNBackSequence(30, 1);
      const sequence2 = generateNBackSequence(30, 3);
      const sequence3 = generateNBackSequence(30, 5);
      
      expect(sequence1).toHaveLength(30);
      expect(sequence2).toHaveLength(30);
      expect(sequence3).toHaveLength(30);
    });
  });

  describe('Проверка ответов', () => {
    test('должна правильно определять совпадения', () => {
      // Последовательность: [0, 1, 2, 0, 3, 4, 1, 5, 2, ...]
      // N = 3
      // На шаге 3: 0 === 0 (позиция 0) - совпадение
      const sequence = [0, 1, 2, 0, 3, 4, 1, 5, 2];
      
      // Шаг 3, позиция 0 - должно быть совпадение
      const result1 = checkNBackAnswer(0, 3, sequence, true, 3);
      expect(result1.isMatch).toBe(true);
      expect(result1.isCorrect).toBe(true);
      
      // Шаг 3, позиция 0 - игрок не нажал - ошибка
      const result2 = checkNBackAnswer(0, 3, sequence, false, 3);
      expect(result2.isMatch).toBe(true);
      expect(result2.isCorrect).toBe(false);
    });

    test('должна правильно обрабатывать отсутствие совпадения', () => {
      const sequence = [0, 1, 2, 3, 4, 5];
      
      // Шаг 3, позиция 3 - нет совпадения (3 !== 0)
      const result1 = checkNBackAnswer(3, 3, sequence, false, 3);
      expect(result1.isMatch).toBe(false);
      expect(result1.isCorrect).toBe(true);
      
      // Шаг 3, позиция 3 - игрок нажал - ошибка
      const result2 = checkNBackAnswer(3, 3, sequence, true, 3);
      expect(result2.isMatch).toBe(false);
      expect(result2.isCorrect).toBe(false);
    });

    test('должна корректно обрабатывать первые N-1 шагов', () => {
      const sequence = [0, 1, 2, 3];
      
      // На шагах 0, 1, 2 (при N=3) совпадений быть не может
      const result1 = checkNBackAnswer(0, 0, sequence, false, 3);
      expect(result1.isMatch).toBe(false);
      expect(result1.isCorrect).toBe(true);
      
      const result2 = checkNBackAnswer(1, 1, sequence, false, 3);
      expect(result2.isMatch).toBe(false);
      expect(result2.isCorrect).toBe(true);
      
      const result3 = checkNBackAnswer(2, 2, sequence, false, 3);
      expect(result3.isMatch).toBe(false);
      expect(result3.isCorrect).toBe(true);
    });

    test('должна работать с разными значениями N', () => {
      // N = 1: проверяем совпадение с предыдущим шагом
      const sequence1 = [0, 1, 2, 0, 0, 5, 6, 7, 8];
      // На шаге 4: sequence1[4] === sequence1[3] (0 === 0) - совпадение
      const result1 = checkNBackAnswer(0, 4, sequence1, true, 1);
      expect(result1.isMatch).toBe(true);
      expect(result1.isCorrect).toBe(true);
      
      // N = 5: проверяем совпадение с шагом 5 назад
      const sequence2 = [0, 1, 2, 3, 4, 0, 6, 7, 8, 0];
      // На шаге 9: sequence2[9] === sequence2[4] (0 === 4) - НЕТ совпадения
      // На шаге 5: sequence2[5] === sequence2[0] (0 === 0) - совпадение
      const result2 = checkNBackAnswer(0, 5, sequence2, true, 5);
      expect(result2.isMatch).toBe(true);
      expect(result2.isCorrect).toBe(true);
    });
  });

  describe('Влияние ошибок на скорость', () => {
    test('должна уменьшать скорость на 10% каждые 3 ошибки', () => {
      const baseSpeed = 2000;
      
      // 0-2 ошибки - скорость не меняется
      expect(calculateNewSpeed(baseSpeed, 0)).toBe(2000);
      expect(calculateNewSpeed(baseSpeed, 1)).toBe(2000);
      expect(calculateNewSpeed(baseSpeed, 2)).toBe(2000);
      
      // 3 ошибки - 10% уменьшение
      expect(calculateNewSpeed(baseSpeed, 3)).toBe(1800);
      
      // 6 ошибок - 20% уменьшение
      expect(calculateNewSpeed(baseSpeed, 6)).toBe(1620);
      
      // 9 ошибок - 27% уменьшение
      expect(calculateNewSpeed(baseSpeed, 9)).toBe(1458);
    });

    test('должна ограничивать минимальную скорость 500мс', () => {
      const baseSpeed = 2000;
      
      // При 30 ошибках: 10 групп по 3 ошибки, скорость = 2000 * 0.9^10 ≈ 697
      expect(calculateNewSpeed(baseSpeed, 30)).toBe(697);
      
      // При 45 ошибках: 15 групп, скорость = 2000 * 0.9^15 ≈ 500 (достигаем минимума)
      expect(calculateNewSpeed(baseSpeed, 45)).toBe(500);
      
      // При очень большом количестве ошибок скорость ограничена 500
      expect(calculateNewSpeed(baseSpeed, 100)).toBe(500);
    });

    test('должна корректно работать с разной базовой скоростью', () => {
      expect(calculateNewSpeed(3000, 3)).toBe(2700);
      expect(calculateNewSpeed(1500, 3)).toBe(1350);
      expect(calculateNewSpeed(1000, 6)).toBe(810);
    });
  });

  describe('Комплексные сценарии', () => {
    test('полный игровой раунд - правильные ответы', () => {
      const sequence = [0, 1, 2, 0, 3, 4, 1, 5, 2];
      const nValue = 3;
      
      let correctAnswers = 0;
      let errors = 0;
      
      sequence.forEach((position, stepNumber) => {
        const isMatch = stepNumber >= nValue && sequence[stepNumber] === sequence[stepNumber - nValue];
        const playerAnswer = isMatch; // Игрок всегда отвечает правильно
        
        const result = checkNBackAnswer(position, stepNumber, sequence, playerAnswer, nValue);
        
        if (result.isCorrect) {
          correctAnswers++;
        } else {
          errors++;
        }
      });
      
      // Ожидаем: 9 правильных ответов (все шаги)
      expect(correctAnswers).toBe(9);
      expect(errors).toBe(0);
    });

    test('полный игровой раунд - ошибки игрока', () => {
      const sequence = [0, 1, 2, 0, 3, 4, 1, 5, 2];
      const nValue = 3;
      
      let correctAnswers = 0;
      let errors = 0;
      
      sequence.forEach((position, stepNumber) => {
        const isMatch = stepNumber >= nValue && sequence[stepNumber] === sequence[stepNumber - nValue];
        const playerAnswer = !isMatch; // Игрок всегда отвечает неправильно
        
        const result = checkNBackAnswer(position, stepNumber, sequence, playerAnswer, nValue);
        
        if (result.isCorrect) {
          correctAnswers++;
        } else {
          errors++;
        }
      });
      
      // Все ответы неправильные
      expect(errors).toBe(sequence.length);
      expect(correctAnswers).toBe(0);
    });

    test('расчёт итоговой скорости после серии ошибок', () => {
      const baseSpeed = 2000;
      
      // Симуляция игры с ошибками
      const errorProgression = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      
      errorProgression.forEach(errorCount => {
        const speed = calculateNewSpeed(baseSpeed, errorCount);
        
        // Проверяем, что скорость уменьшается только каждые 3 ошибки
        if (errorCount < 3) {
          expect(speed).toBe(2000);
        } else if (errorCount < 6) {
          expect(speed).toBe(1800);
        } else if (errorCount < 9) {
          expect(speed).toBe(1620);
        } else {
          expect(speed).toBe(1458);
        }
      });
    });
  });

  describe('Граничные случаи', () => {
    test('должна корректно обрабатывать минимальную последовательность', () => {
      const sequence = [0];
      const result = checkNBackAnswer(0, 0, sequence, false, 3);
      expect(result.isMatch).toBe(false);
      expect(result.isCorrect).toBe(true);
    });

    test('должна корректно обрабатывать N больше длины последовательности', () => {
      const sequence = [0, 1, 2];
      const result = checkNBackAnswer(2, 2, sequence, false, 5);
      expect(result.isMatch).toBe(false);
      expect(result.isCorrect).toBe(true);
    });

    test('должна корректно обрабатывать максимальные значения позиций', () => {
      const sequence = [8, 8, 8, 8];
      const result = checkNBackAnswer(8, 3, sequence, true, 3);
      expect(result.isMatch).toBe(true);
      expect(result.isCorrect).toBe(true);
    });
  });
});

// Экспорт функций для использования в других тестах
export { checkNBackAnswer, generateNBackSequence, calculateNewSpeed };
