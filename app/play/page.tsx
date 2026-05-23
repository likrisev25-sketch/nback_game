'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function PlayPage() {
  const router = useRouter();
  
  // Настройки игры
  const [nValue, setNValue] = useState(2);
  const [totalSteps, setTotalSteps] = useState(20);
  const [baseSpeedMs, setBaseSpeedMs] = useState(2000);
  const [addBot, setAddBot] = useState(true);
  const [botAccuracy, setBotAccuracy] = useState(80);
  
  // Состояние игры
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [sequence, setSequence] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [playerScore, setPlayerScore] = useState({ correct: 0, errors: 0 });
  const [botScore, setBotScore] = useState({ correct: 0, errors: 0 });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showMatchButton, setShowMatchButton] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnsweredRef = useRef<boolean>(false);

  // Генерация последовательности N-back
  const generateSequence = useCallback((steps: number, n: number, gridSize: number = 9): number[] => {
    const positions: number[] = [];
    
    for (let i = 0; i < steps; i++) {
      let position: number;
      
      // 30% шанс совпадения с N-шагом назад
      if (i >= n && Math.random() < 0.3) {
        position = positions[i - n];
      } else {
        position = Math.floor(Math.random() * gridSize);
      }
      
      positions.push(position);
    }
    
    return positions;
  }, []);

  // Проверка совпадения
  const checkMatch = useCallback((stepIndex: number, n: number, seq: number[]): boolean => {
    if (stepIndex < n) return false;
    return seq[stepIndex] === seq[stepIndex - n];
  }, []);

  // Ответ игрока
  const handlePlayerAnswer = useCallback((playerAnswer: boolean) => {
    if (hasAnsweredRef.current || !gameStarted) return;
    
    hasAnsweredRef.current = true;
    const isMatch = checkMatch(currentStep, nValue, sequence);
    const isCorrect = playerAnswer === isMatch;
    
    if (isCorrect) {
      setPlayerScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setFeedback('correct');
    } else {
      setPlayerScore(prev => ({ ...prev, errors: prev.errors + 1 }));
      setFeedback('wrong');
    }
    
    setTimeout(() => setFeedback(null), 500);
  }, [currentStep, nValue, sequence, gameStarted, checkMatch]);

  // Ответ бота
  const handleBotAnswer = useCallback(() => {
    if (!addBot || hasAnsweredRef.current || !gameStarted) return;
    
    // Бот отвечает с задержкой
    setTimeout(() => {
      const isMatch = checkMatch(currentStep, nValue, sequence);
      // Бот ошибается с вероятностью (100 - botAccuracy)%
      const shouldAnswer = Math.random() < (botAccuracy / 100);
      const botAnswer = shouldAnswer && isMatch;
      
      const isCorrect = botAnswer === isMatch;
      
      if (isCorrect) {
        setBotScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      } else {
        setBotScore(prev => ({ ...prev, errors: prev.errors + 1 }));
      }
    }, 500 + Math.random() * 500); // Задержка 500-1000мс
  }, [currentStep, nValue, sequence, addBot, botAccuracy, gameStarted, checkMatch]);

  // Игровой цикл
  const runGameLoop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (currentStep >= totalSteps) {
      setGameFinished(true);
      setGameStarted(false);
      return;
    }
    
    // Показываем позицию
    const position = sequence[currentStep];
    setActivePosition(position);
    setCurrentStep(prev => prev);
    hasAnsweredRef.current = false;
    setShowMatchButton(true);
    
    // Бот отвечает
    handleBotAnswer();
    
    // Скрываем позицию и переходим к следующему шагу
    timerRef.current = setTimeout(() => {
      setActivePosition(null);
      setShowMatchButton(false);
      
      timerRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        runGameLoop();
      }, 500);
    }, baseSpeedMs);
  }, [currentStep, totalSteps, sequence, baseSpeedMs, addBot, botAccuracy, handleBotAnswer]);

  // Запуск игры
  const startGame = () => {
    const newSequence = generateSequence(totalSteps, nValue);
    setSequence(newSequence);
    setCurrentStep(0);
    setActivePosition(null);
    setPlayerScore({ correct: 0, errors: 0 });
    setBotScore({ correct: 0, errors: 0 });
    setGameFinished(false);
    setGameStarted(true);
    setShowMatchButton(false);
    
    // Начинаем игру с задержкой
    setTimeout(() => {
      runGameLoop();
    }, 1000);
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Рендер экрана настройки
  if (!gameStarted && !gameFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
            N-Back Game
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Тренируй рабочую память
          </p>

          <div className="space-y-6">
            {/* Настройка N */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                N-значение: {nValue}-back
              </label>
              <input
                type="range"
                min="1"
                max="4"
                value={nValue}
                onChange={(e) => setNValue(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (Легко)</span>
                <span>4 (Сложно)</span>
              </div>
            </div>

            {/* Настройка шагов */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Шагов: {totalSteps}
              </label>
              <input
                type="range"
                min="10"
                max="50"
                step="10"
                value={totalSteps}
                onChange={(e) => setTotalSteps(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Настройка скорости */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Скорость: {baseSpeedMs}мс
              </label>
              <input
                type="range"
                min="1000"
                max="3000"
                step="500"
                value={baseSpeedMs}
                onChange={(e) => setBaseSpeedMs(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1000мс (Быстро)</span>
                <span>3000мс (Медленно)</span>
              </div>
            </div>

            {/* Настройка бота */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={addBot}
                  onChange={(e) => setAddBot(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Играть с ботом
                </span>
              </label>

              {addBot && (
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Точность бота: {botAccuracy}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={botAccuracy}
                    onChange={(e) => setBotAccuracy(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Кнопка старта */}
            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              🎮 Начать игру
            </button>

            {/* Кнопка назад */}
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              ← На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Рендер экрана результатов
  if (gameFinished) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
            Игра окончена! 🎉
          </h2>

          <div className="space-y-4 mb-8">
            <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Вы</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {playerScore.correct} правильных / {playerScore.errors} ошибок
              </p>
            </div>

            {addBot && (
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Бот</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {botScore.correct} правильных / {botScore.errors} ошибок
                </p>
              </div>
            )}
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition mb-3"
          >
            🔄 Играть снова
          </button>

          <button
            onClick={() => {
              setGameFinished(false);
              setGameStarted(false);
            }}
            className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>
    );
  }

  // Рендер экрана игры
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full">
        {/* Статистика */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">Вы</p>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {playerScore.correct} / {playerScore.errors}
            </p>
          </div>
          {addBot && (
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">Бот</p>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {botScore.correct} / {botScore.errors}
              </p>
            </div>
          )}
        </div>

        {/* Прогресс */}
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Шаг {currentStep + 1} / {totalSteps}
          </p>
        </div>

        {/* Сетка 3x3 */}
        <div className="grid grid-cols-3 gap-2 mb-6 aspect-square max-w-xs mx-auto">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-lg transition-all duration-200 ${
                activePosition === index
                  ? 'bg-blue-600 scale-110 shadow-lg'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Кнопка совпадения */}
        <button
          onClick={() => handlePlayerAnswer(true)}
          disabled={!showMatchButton || hasAnsweredRef.current}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            showMatchButton && !hasAnsweredRef.current
              ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {hasAnsweredRef.current ? 'Ответ принят' : 'Совпадение!'}
        </button>

        {/* Фидбек */}
        {feedback && (
          <div className={`mt-4 text-center py-2 rounded-lg font-semibold ${
            feedback === 'correct' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {feedback === 'correct' ? '✅ Верно!' : '❌ Ошибка!'}
          </div>
        )}

        {/* Инструкция */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          Нажми «Совпадение», если текущая позиция совпадает с позицией {nValue} шагов назад
        </p>
      </div>
    </div>
  );
}
