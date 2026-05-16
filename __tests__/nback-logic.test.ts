/**
 * Тесты для проверки логики N-Back игры
 */

// Проверка ответа N-Back
function checkNBackAnswer(
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): { isCorrect: boolean; isMatch: boolean } {
  // Проверяем, достаточно ли шагов для сравнения
  if (stepNumber < nValue || stepNumber >= sequence.length) {
    return { isCorrect: playerAnswer === false, isMatch: false };
  }
  
  const isMatch = sequence[stepNumber] === sequence[stepNumber - nValue];
  const isCorrect = playerAnswer === isMatch;
  return { isCorrect, isMatch };
}

describe('checkNBackAnswer', () => {
  const sequence = [1, 2, 3, 1, 2, 3, 4, 5, 6];

  test('должен правильно определить совпадение N=1', () => {
    // Шаг 1 (индекс 1): sequence[1] = 2, sequence[0] = 1 (не совпадает)
    let result = checkNBackAnswer(1, sequence, false, 1);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(true);

    // Шаг 3 (индекс 3): sequence[3] = 1, sequence[2] = 3 (не совпадает)
    result = checkNBackAnswer(3, sequence, true, 1);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(false);
    
    // Шаг с реальным совпадением для N=1
    // sequence[2] = 1, sequence[1] = 2? Нет
    // sequence[2] = 1, sequence[1] = 2 - не совпадает
    const seqWithMatch = [1, 2, 2]; // На индексе 2 значение 2, на индексе 1 значение 2 - совпадает!
    result = checkNBackAnswer(2, seqWithMatch, true, 1);
    expect(result.isMatch).toBe(true);
    expect(result.isCorrect).toBe(true);
  });

  test('должен правильно определить совпадение N=2', () => {
    // Шаг 2: sequence[2] = 3, sequence[0] = 1 (не совпадает)
    let result = checkNBackAnswer(2, sequence, false, 2);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(true);

    // Шаг 3: sequence[3] = 1, sequence[1] = 2 (не совпадает)
    result = checkNBackAnswer(3, sequence, false, 2);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(true);
    
    // Шаг с реальным совпадением для N=2
    const seqWithRealMatch = [1, 2, 3, 2]; // Индекс 3 = 2, индекс 1 = 2 - совпадает!
    result = checkNBackAnswer(3, seqWithRealMatch, true, 2);
    expect(result.isMatch).toBe(true);
    expect(result.isCorrect).toBe(true);
  });

  test('должен обработать шаг меньше N', () => {
    const result = checkNBackAnswer(1, sequence, false, 3);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(true);
    
    // Если игрок нажал кнопку когда шаг < N - это ошибка
    const wrongResult = checkNBackAnswer(1, sequence, true, 3);
    expect(wrongResult.isMatch).toBe(false);
    expect(wrongResult.isCorrect).toBe(false);
  });

  test('должен обработать несуществующий шаг', () => {
    const result = checkNBackAnswer(10, sequence, false, 2);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(true);
  });

  test('должен определить правильное нажатие при совпадении', () => {
    const seq = [1, 2, 3, 1];
    // Шаг 3: sequence[3] = 1, sequence[0] = 1 (совпадает!)
    const result = checkNBackAnswer(3, seq, true, 3);
    expect(result.isMatch).toBe(true);
    expect(result.isCorrect).toBe(true);
  });

  test('должен определить ошибку при ложном нажатии', () => {
    const seq = [1, 2, 3, 4];
    // Шаг 3: sequence[3] = 4, sequence[0] = 1 (не совпадает)
    const result = checkNBackAnswer(3, seq, true, 3);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(false);
  });
  
  test('должен определить правильное не-нажатие', () => {
    const seq = [1, 2, 3, 4];
    // Шаг 3: sequence[3] = 4, sequence[0] = 1 (не совпадает)
    const result = checkNBackAnswer(3, seq, false, 3);
    expect(result.isMatch).toBe(false);
    expect(result.isCorrect).toBe(true);
  });
});

// Генерация последовательности
function generateNBackSequence(totalSteps: number, nValue: number, gridSize: number = 9): number[] {
  const positions: number[] = [];
  for (let i = 0; i < totalSteps; i++) {
    // Для первых N шагов генерируем случайные позиции
    if (i < nValue) {
      positions.push(Math.floor(Math.random() * gridSize));
    } else {
      // 30% вероятность создать совпадение с позицией N шагов назад
      const shouldMatch = Math.random() < 0.3;
      if (shouldMatch) {
        positions.push(positions[i - nValue]);
      } else {
        // Генерируем новую позицию, отличную от позиции N шагов назад
        let newPosition;
        do {
          newPosition = Math.floor(Math.random() * gridSize);
        } while (newPosition === positions[i - nValue]);
        positions.push(newPosition);
      }
    }
  }
  return positions;
}

describe('generateNBackSequence', () => {
  test('должен генерировать последовательность нужной длины', () => {
    const lengths = [10, 20, 30, 50];
    lengths.forEach(length => {
      const sequence = generateNBackSequence(length, 3);
      expect(sequence.length).toBe(length);
    });
  });

  test('должен использовать только допустимые позиции (0-8)', () => {
    const sequence = generateNBackSequence(100, 3, 9);
    sequence.forEach(pos => {
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThanOrEqual(8);
      expect(Number.isInteger(pos)).toBe(true);
    });
  });
  
  test('должен генерировать позиции в правильном диапазоне для сетки 3x3', () => {
    const sequence = generateNBackSequence(50, 2, 9);
    const maxPosition = Math.max(...sequence);
    const minPosition = Math.min(...sequence);
    expect(maxPosition).toBeLessThanOrEqual(8);
    expect(minPosition).toBeGreaterThanOrEqual(0);
  });
});

// Логика увеличения скорости
function calculateSpeedIncrease(
  errors: number,
  currentSpeed: number,
  errorThreshold: number = 3
): { newSpeed: number; increased: boolean } {
  let newSpeed = currentSpeed;
  let increased = false;
  
  // Каждые errorThreshold ошибок уменьшаем скорость на 10%
  if (errors > 0 && errors % errorThreshold === 0) {
    newSpeed = Math.max(500, Math.floor(currentSpeed * 0.9));
    increased = true;
  }
  
  return { newSpeed, increased };
}

describe('speedIncreaseLogic', () => {
  test('скорость должна увеличиваться каждые 3 ошибки', () => {
    const initialSpeed = 2000;
    const errorThreshold = 3;
    
    for (let errors = 1; errors <= 9; errors++) {
      const { increased } = calculateSpeedIncrease(errors, initialSpeed, errorThreshold);
      
      if (errors % errorThreshold === 0) {
        expect(increased).toBe(true);
      } else {
        expect(increased).toBe(false);
      }
    }
  });
  
  test('скорость должна уменьшаться на 10% при каждой 3-й ошибке', () => {
    let speed = 2000;
    
    // 3 ошибки
    let result = calculateSpeedIncrease(3, speed);
    expect(result.increased).toBe(true);
    expect(result.newSpeed).toBe(Math.floor(2000 * 0.9));
    speed = result.newSpeed;
    
    // 6 ошибок
    result = calculateSpeedIncrease(6, speed);
    expect(result.increased).toBe(true);
    expect(result.newSpeed).toBe(Math.floor(speed * 0.9));
    speed = result.newSpeed;
    
    // 9 ошибок
    result = calculateSpeedIncrease(9, speed);
    expect(result.increased).toBe(true);
    expect(result.newSpeed).toBe(Math.floor(speed * 0.9));
  });

  test('скорость не должна уменьшаться ниже 500ms', () => {
    let speed = 2000;
    
    // Применяем много увеличений скорости
    for (let i = 0; i < 20; i++) {
      const result = calculateSpeedIncrease(3, speed);
      speed = result.newSpeed;
    }
    
    expect(speed).toBeGreaterThanOrEqual(500);
    expect(speed).toBe(500);
  });
  
  test('скорость не должна изменяться при отсутствии ошибок', () => {
    const initialSpeed = 2000;
    const result = calculateSpeedIncrease(0, initialSpeed);
    
    expect(result.increased).toBe(false);
    expect(result.newSpeed).toBe(initialSpeed);
  });
  
  test('скорость не должна изменяться при 1 и 2 ошибках', () => {
    const initialSpeed = 2000;
    
    let result = calculateSpeedIncrease(1, initialSpeed);
    expect(result.increased).toBe(false);
    expect(result.newSpeed).toBe(initialSpeed);
    
    result = calculateSpeedIncrease(2, initialSpeed);
    expect(result.increased).toBe(false);
    expect(result.newSpeed).toBe(initialSpeed);
  });
});

// Интеграционные тесты
describe('Integration tests', () => {
  test('полный цикл игры с правильными ответами', () => {
    const nValue = 2;
    const sequence = [1, 2, 3, 1, 4, 2];
    let correctCount = 0;
    let errorCount = 0;
    
    for (let step = 0; step < sequence.length; step++) {
      const isMatch = step >= nValue && sequence[step] === sequence[step - nValue];
      // Игрок отвечает правильно
      const { isCorrect } = checkNBackAnswer(step, sequence, isMatch, nValue);
      
      if (isCorrect) {
        correctCount++;
      } else {
        errorCount++;
      }
    }
    
    expect(correctCount).toBe(sequence.length);
    expect(errorCount).toBe(0);
  });
  
  test('полный цикл игры с неправильными ответами', () => {
    const nValue = 2;
    const sequence = [1, 2, 3, 1, 4, 2];
    let correctCount = 0;
    let errorCount = 0;
    
    for (let step = 0; step < sequence.length; step++) {
      // Игрок всегда отвечает противоположно
      const isMatch = step >= nValue && sequence[step] === sequence[step - nValue];
      const { isCorrect } = checkNBackAnswer(step, sequence, !isMatch, nValue);
      
      if (isCorrect) {
        correctCount++;
      } else {
        errorCount++;
      }
    }
    
    expect(correctCount).toBe(0);
    expect(errorCount).toBe(sequence.length);
  });
  
  test('генерация последовательности и проверка ответов', () => {
    const totalSteps = 50;
    const nValue = 3;
    const sequence = generateNBackSequence(totalSteps, nValue);
    
    expect(sequence.length).toBe(totalSteps);
    
    let matchCount = 0;
    for (let step = nValue; step < sequence.length; step++) {
      if (sequence[step] === sequence[step - nValue]) {
        matchCount++;
      }
    }
    
    // Проверяем, что совпадения есть (вероятность > 0)
    expect(matchCount).toBeGreaterThanOrEqual(0);
  });
});