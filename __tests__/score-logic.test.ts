/**
 * Тесты для новой логики начисления очков
 * Очки начисляются ТОЛЬКО за активное нажатие на совпадение
 */

describe('Score Logic', () => {
  describe('Новая система начисления', () => {
    interface ScoreResult {
      correctAnswers: number;
      errors: number;
    }

    function calculateScore(
      playerAnswer: boolean,
      isMatch: boolean,
      isCorrect: boolean,
      currentScore: ScoreResult
    ): ScoreResult {
      const newScore = { ...currentScore };

      // Очки ТОЛЬКО за активное нажатие на реальное совпадение
      if (playerAnswer === true && isMatch === true) {
        newScore.correctAnswers += 1;
      }

      // Ошибка за любое неправильное действие
      if (!isCorrect) {
        newScore.errors += 1;
      }

      return newScore;
    }

    test('нажатие на совпадение = +1 очко', () => {
      const result = calculateScore(true, true, true, { correctAnswers: 0, errors: 0 });
      expect(result.correctAnswers).toBe(1);
      expect(result.errors).toBe(0);
    });

    test('нажатие без совпадения = +1 ошибка', () => {
      const result = calculateScore(true, false, false, { correctAnswers: 0, errors: 0 });
      expect(result.correctAnswers).toBe(0);
      expect(result.errors).toBe(1);
    });

    test('пропуск совпадения (не нажал) = +1 ошибка', () => {
      const result = calculateScore(false, true, false, { correctAnswers: 0, errors: 0 });
      expect(result.correctAnswers).toBe(0);
      expect(result.errors).toBe(1);
    });

    test('правильное бездействие (нет совпадения, не нажал) = 0 очков, 0 ошибок', () => {
      const result = calculateScore(false, false, true, { correctAnswers: 0, errors: 0 });
      expect(result.correctAnswers).toBe(0);
      expect(result.errors).toBe(0);
    });

    test('серия из 5 ходов', () => {
      let score = { correctAnswers: 0, errors: 0 };

      // Ход 1: Нажал на совпадение
      score = calculateScore(true, true, true, score);
      expect(score).toEqual({ correctAnswers: 1, errors: 0 });

      // Ход 2: Нажал без совпадения (ошибка)
      score = calculateScore(true, false, false, score);
      expect(score).toEqual({ correctAnswers: 1, errors: 1 });

      // Ход 3: Пропустил совпадение (ошибка)
      score = calculateScore(false, true, false, score);
      expect(score).toEqual({ correctAnswers: 1, errors: 2 });

      // Ход 4: Правильное бездействие
      score = calculateScore(false, false, true, score);
      expect(score).toEqual({ correctAnswers: 1, errors: 2 });

      // Ход 5: Нажал на совпадение
      score = calculateScore(true, true, true, score);
      expect(score).toEqual({ correctAnswers: 2, errors: 2 });
    });
  });

  describe('Логика checkNBackAnswer', () => {
    function checkNBackAnswer(
      stepNumber: number,
      sequence: number[],
      playerAnswer: boolean,
      nValue: number
    ): { isCorrect: boolean; isMatch: boolean } {
      if (stepNumber < nValue || stepNumber >= sequence.length) {
        return { isCorrect: playerAnswer === false, isMatch: false };
      }

      const isMatch = sequence[stepNumber] === sequence[stepNumber - nValue];
      const isCorrect = playerAnswer === isMatch;
      return { isCorrect, isMatch };
    }

    test('правильное нажатие при совпадении N=2', () => {
      const sequence = [1, 2, 1, 3];
      // Шаг 2: sequence[2]=1, sequence[0]=1 → совпадение
      const result = checkNBackAnswer(2, sequence, true, 2);
      expect(result.isMatch).toBe(true);
      expect(result.isCorrect).toBe(true);
    });

    test('ложное нажатие без совпадения N=2', () => {
      const sequence = [1, 2, 3, 4];
      // Шаг 2: sequence[2]=3, sequence[0]=1 → нет совпадения
      const result = checkNBackAnswer(2, sequence, true, 2);
      expect(result.isMatch).toBe(false);
      expect(result.isCorrect).toBe(false);
    });

    test('пропуск совпадения N=2', () => {
      const sequence = [1, 2, 1, 3];
      // Шаг 2: sequence[2]=1, sequence[0]=1 → совпадение, но игрок не нажал
      const result = checkNBackAnswer(2, sequence, false, 2);
      expect(result.isMatch).toBe(true);
      expect(result.isCorrect).toBe(false);
    });

    test('правильное бездействие N=2', () => {
      const sequence = [1, 2, 3, 4];
      // Шаг 2: sequence[2]=3, sequence[0]=1 → нет совпадения, игрок не нажал
      const result = checkNBackAnswer(2, sequence, false, 2);
      expect(result.isMatch).toBe(false);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Полный цикл игры с новой логикой', () => {
    function checkNBackAnswer(
      stepNumber: number,
      sequence: number[],
      playerAnswer: boolean,
      nValue: number
    ): { isCorrect: boolean; isMatch: boolean } {
      if (stepNumber < nValue || stepNumber >= sequence.length) {
        return { isCorrect: playerAnswer === false, isMatch: false };
      }
      const isMatch = sequence[stepNumber] === sequence[stepNumber - nValue];
      const isCorrect = playerAnswer === isMatch;
      return { isCorrect, isMatch };
    }

    function calculateScore(
      playerAnswer: boolean,
      isMatch: boolean,
      isCorrect: boolean,
      currentScore: { correctAnswers: number; errors: number }
    ): { correctAnswers: number; errors: number } {
      const newScore = { ...currentScore };
      if (playerAnswer === true && isMatch === true) {
        newScore.correctAnswers += 1;
      }
      if (!isCorrect) {
        newScore.errors += 1;
      }
      return newScore;
    }

    test('игра N=2, последовательность [1,2,1,3,2,1]', () => {
      const nValue = 2;
      const sequence = [1, 2, 1, 3, 2, 1];
      // Совпадения:
      // Шаг 2: 1 === sequence[0]=1 ✅
      // Шаг 4: 2 === sequence[2]=1 ❌
      // Шаг 5: 1 === sequence[3]=3 ❌

      let score = { correctAnswers: 0, errors: 0 };

      // Игрок нажимает на шагах 2 и 4
      const playerAnswers = [false, false, true, false, true, false];

      for (let step = 0; step < sequence.length; step++) {
        const { isCorrect, isMatch } = checkNBackAnswer(step, sequence, playerAnswers[step], nValue);
        score = calculateScore(playerAnswers[step], isMatch, isCorrect, score);
      }

      // Шаг 2: нажал, совпадение есть → +1 очко
      // Шаг 4: нажал, совпадения нет → +1 ошибка
      expect(score.correctAnswers).toBe(1);
      expect(score.errors).toBe(1);
    });

    test('игра N=2, идеальная игра', () => {
      const nValue = 2;
      const sequence = [1, 2, 1, 3, 2, 1];

      let score = { correctAnswers: 0, errors: 0 };

      // Идеальные ответы: нажимать только при совпадении
      const playerAnswers = [false, false, true, false, false, false];

      for (let step = 0; step < sequence.length; step++) {
        const { isCorrect, isMatch } = checkNBackAnswer(step, sequence, playerAnswers[step], nValue);
        score = calculateScore(playerAnswers[step], isMatch, isCorrect, score);
      }

      // Шаг 2: нажал, совпадение → +1 очко
      // Остальные: правильное бездействие → 0
      expect(score.correctAnswers).toBe(1);
      expect(score.errors).toBe(0);
    });

    test('игра N=2, много ошибок', () => {
      const nValue = 2;
      const sequence = [1, 2, 1, 3, 2, 1];

      let score = { correctAnswers: 0, errors: 0 };

      // Игрок нажимает на каждом шаге (плохая стратегия)
      const playerAnswers = [false, false, true, true, true, true];

      for (let step = 0; step < sequence.length; step++) {
        const { isCorrect, isMatch } = checkNBackAnswer(step, sequence, playerAnswers[step], nValue);
        score = calculateScore(playerAnswers[step], isMatch, isCorrect, score);
      }

      // Шаг 2: нажал, совпадение → +1 очко
      // Шаги 3,4,5: нажал, нет совпадения → +3 ошибки
      expect(score.correctAnswers).toBe(1);
      expect(score.errors).toBe(3);
    });
  });
});
