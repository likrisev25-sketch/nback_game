'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Grid3x3 } from './Grid3x3';

/**
 * Главный компонент игры N-back
 * 
 * REST API версия без WebSocket и авторизации
 */
export const NBackGame: React.FC<{
  sessionId: string;
  playerId: string;
  nValue: number;
  onComplete: (correctAnswers: number, errors: number) => void;
  onError?: (error: Error) => void;
}> = ({ sessionId, playerId, nValue, onComplete, onError }) => {
  console.log('🔴 [NBackGame] КОМПОНЕНТ ИНИЦИАЛИЗИРОВАН');
  
  // Состояние игры
  const [sequence, setSequence] = useState<number[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentSpeedMs, setCurrentSpeedMs] = useState(2000);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [speedIncreaseNotification, setSpeedIncreaseNotification] = useState(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [players, setPlayers] = useState<Array<{
    id: string;
    name: string;
    correctAnswers: number;
    errors: number;
    isBot: boolean;
  }>>([]);
  const [displayStep, setDisplayStep] = useState(0);
  const [activePosition, setActivePosition] = useState<number | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  // Refs для игрового цикла
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef<number>(0);
  const hasAnsweredForStepRef = useRef<Map<number, boolean>>(new Map()); // Храним ответы для каждого шага
  const gameStartedRef = useRef<boolean>(false);
  const sequenceRef = useRef<number[]>([]);
  const speedRef = useRef<number>(2000);
  const nValueRef = useRef<number>(nValue);
  const sessionIdRef = useRef<string>(sessionId);
  const playerIdRef = useRef<string>(playerId);
  const isProcessingAnswerRef = useRef<boolean>(false); // Предотвращаем множественные ответы

  // Синхронизация refs с пропсами
  useEffect(() => {
    nValueRef.current = nValue;
    sessionIdRef.current = sessionId;
    playerIdRef.current = playerId;
  }, [nValue, sessionId, playerId]);

  // Загрузка статистики игроков
  const loadPlayerStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/${sessionId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players.map((p: { id: string; name: string; isBot: boolean; correctAnswers: number; errors: number }) => ({
          id: p.id,
          name: p.name || (p.isBot ? 'Бот' : 'Игрок'),
          correctAnswers: p.correctAnswers,
          errors: p.errors,
          isBot: p.isBot,
        })));
        if (data.session.currentSpeedMs) {
          setCurrentSpeedMs(data.session.currentSpeedMs);
          speedRef.current = data.session.currentSpeedMs;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  }, [sessionId]);
    
  // Отправка ответа игрока
  const sendAnswer = useCallback(async (stepNumber: number, playerAnswer: boolean, position: number) => {
    // Проверяем, не обрабатывается ли уже ответ
    if (isProcessingAnswerRef.current) {
      console.log('⛔ Уже обрабатывается другой ответ');
      return;
    }
    
    // Проверяем, не отправлял ли уже ответ для этого шага
    if (hasAnsweredForStepRef.current.get(stepNumber)) {
      console.log('⛔ Ответ уже отправлен для шага', stepNumber);
      return;
    }
    
    isProcessingAnswerRef.current = true;
    hasAnsweredForStepRef.current.set(stepNumber, true);
    
    try {
      console.log(`📤 Отправка ответа для шага ${stepNumber}: answer=${playerAnswer}, position=${position}`);
      
      const response = await fetch(`/api/game/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          playerId,
          position,
          stepNumber,
          playerAnswer,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сервера');
      }
      
      const data = await response.json();
      console.log('✅ Ответ обработан:', data);
      
      setCorrectAnswers(data.correctAnswers);
      setErrors(data.errors);
      
      if (data.newSpeedMs) {
        setCurrentSpeedMs(data.newSpeedMs);
        speedRef.current = data.newSpeedMs;
      }
      
      if (data.isCorrect) {
        setFeedback('correct');
      } else {
        setFeedback('wrong');
      }
      
      if (data.speedIncreased) {
        setSpeedIncreaseNotification(true);
        setTimeout(() => setSpeedIncreaseNotification(false), 3000);
      }
      
      setTimeout(() => setFeedback(null), 500);
    } catch (error) {
      console.error('❌ Ошибка отправки ответа:', error);
      // В случае ошибки снимаем флаг, чтобы можно было попробовать снова
      hasAnsweredForStepRef.current.delete(stepNumber);
    } finally {
      isProcessingAnswerRef.current = false;
    }
  }, [sessionId, playerId]);

  // Обработка нажатия на кнопку "Совпадение"
  const handleMatchClick = useCallback(() => {
    console.log('🎯 [handleMatchClick] КНОПКА НАЖАТА!');
    console.log('  gameStatus:', gameStatus);
    console.log('  activePosition:', activePosition);
    console.log('  stepRef.current:', stepRef.current);
    
    if (gameStatus !== 'playing') {
      console.log('⛔ gameStatus !== playing');
      return;
    }
    
    if (activePosition === null) {
      console.log('⛔ activePosition === null');
      return;
    }
    
    const currentStep = stepRef.current;
    
    if (hasAnsweredForStepRef.current.get(currentStep)) {
      console.log('⛔ Ответ уже отправлен для шага', currentStep);
      return;
    }
    
    console.log('✅ Прошли все проверки, отправляем ответ');
    const position = activePosition;
    
    console.log('📤 Отправляем ответ: playerAnswer=true, stepNumber=', currentStep, ', position=', position);
    sendAnswer(currentStep, true, position);
  }, [sendAnswer, gameStatus, activePosition]);

  // Игровой цикл
  const runGameLoop = useCallback(() => {
    console.log('🎮 [runGameLoop] Запуск цикла, шаг', stepRef.current);
    
    // Очищаем предыдущий таймер
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const currentStep = stepRef.current;
    
    if (currentStep >= sequenceRef.current.length) {
      console.log('🏁 Конец игры!');
      endGame();
      return;
    }
    
    const position = sequenceRef.current[currentStep];
    
    console.log('📍 Шаг', currentStep, ': Показываем позицию', position);
    
    setActivePosition(position);
    setDisplayStep(currentStep);
    setFeedback(null);
    
    // Вызываем ход бота на этом шаге (бот играет НЕЗАВИСИМО)
    const triggerBotMove = async () => {
      try {
        const response = await fetch(`/api/game/${sessionId}/bot-move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepNumber: currentStep }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🤖 [client] Бот ответил:', data);
          // Обновляем статистику после ответа бота
          loadPlayerStats();
        }
      } catch (error) {
        console.error('❌ [client] Ошибка вызова бота:', error);
      }
    };
    
    // Запускаем бота с небольшой задержкой (симуляция реакции)
    setTimeout(() => {
      triggerBotMove();
    }, 100);
    
    // Планируем следующий шаг с текущей скоростью
    timerRef.current = setTimeout(() => {
      console.log('⏱️ Переход к следующему шагу');
      
      // УБРАЛИ авто-ответы - теперь игрок получает очки только за активные нажатия
      // Если игрок не нажал кнопку - ничего не происходит (0 очков, 0 ошибок)
      
      setActivePosition(null);
      stepRef.current += 1;
      runGameLoop();
    }, speedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, loadPlayerStats]);

  // Функция для завершения игры
  const endGame = useCallback(async () => {
    console.log('🏁 [endGame] Конец игры');
    console.log('  sessionId:', sessionId);
    console.log('  playerId:', playerId);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setGameStatus('finished');
    gameStartedRef.current = false;
    
    // Даем небольшую задержку для обновления статистики на сервере
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Получаем финальную статистику с сервера
    try {
      console.log('📊 Загрузка финальной статистики с сервера...');
      const response = await fetch(`/api/game/${sessionId}/stats`);
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Ответ от /stats:', data);
        
        const playerStats = data.players.find((p: { id: string; correctAnswers: number; errors: number }) => 
          p.id === playerId
        );
        
        if (playerStats) {
          const finalCorrect = playerStats.correctAnswers;
          const finalErrors = playerStats.errors;
          console.log('✅ Финальная статистика с сервера:', { finalCorrect, finalErrors });
          setCorrectAnswers(finalCorrect);
          setErrors(finalErrors);
          onComplete(finalCorrect, finalErrors);
          return;
        }
      }
      
      console.log('⚠️ Не удалось получить статистику с сервера');
    } catch (error) {
      console.error('❌ Ошибка получения финальной статистики:', error);
    }
    
    // Если не удалось получить с сервера, используем локальное состояние
    console.log('📊 Используем локальные данные:', { correctAnswers, errors });
    onComplete(correctAnswers, errors);
  }, [sessionId, playerId, correctAnswers, errors, onComplete]);

  // Выход из игры
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(() => {
    // Отправляем текущие результаты на сервер
    fetch(`/api/game/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        playerId,
        correctAnswers,
        errors,
      }),
    }).catch(console.error);
    
    // Возвращаемся в меню
    onComplete(correctAnswers, errors);
    setShowExitConfirm(false);
  }, [sessionId, playerId, correctAnswers, errors, onComplete]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Запуск игры
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startGame = useCallback(async () => {
    console.log('🎮 [startGame] Нажата кнопка "Начать игру"');
    
    // Очищаем предыдущее состояние
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    stepRef.current = 0;
    hasAnsweredForStepRef.current.clear();
    isProcessingAnswerRef.current = false;
    gameStartedRef.current = true;
    
    try {
      // Запускаем игру на сервере
      const startResponse = await fetch(`/api/game/${sessionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || 'Ошибка запуска игры');
      }
      
      console.log('✅ Игра запущена на сервере');
      
      // Получаем последовательность
      const sequenceResponse = await fetch(`/api/game/${sessionId}/sequence`);
      
      if (!sequenceResponse.ok) {
        throw new Error('Ошибка получения последовательности');
      }
      
      const sequenceData = await sequenceResponse.json();
      console.log('🔢 Получена последовательность:', sequenceData.sequence);
      
      // Устанавливаем состояние
      setGameStatus('playing');
      setSequence(sequenceData.sequence);
      sequenceRef.current = sequenceData.sequence;
      setCorrectAnswers(0);
      setErrors(0);
      setDisplayStep(0);
      setActivePosition(null);
      
      // Загружаем начальную статистику
      await loadPlayerStats();
      
      // Небольшая задержка перед началом цикла
      setTimeout(() => {
        console.log('✅ Запускаем игровой цикл');
        runGameLoop();
      }, 500);
      
    } catch (error) {
      console.error('❌ Ошибка начала игры:', error);
      
      // Уведомляем об ошибке через onError
      if (onError) {
        onError(error instanceof Error ? error : new Error('Неизвестная ошибка'));
      } else {
        alert('Ошибка начала игры: ' + (error as Error).message);
      }
      
      setGameStatus('waiting');
      gameStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, loadPlayerStats, onError]);

  // При монтировании проверяем статус игры — если уже playing, сразу начинаем
  useEffect(() => {
    const checkAndStart = async () => {
      try {
        const response = await fetch(`/api/game/${sessionId}/stats`);
        if (response.ok) {
          const data = await response.json();
          if (data.session?.status === 'playing' && !gameStartedRef.current) {
            console.log('🎮 [NBackGame] Игра уже запущена на сервере, автостарт');
            // Автоматически начинаем игру без показа кнопки
            await autoStartGame(data);
          }
        }
      } catch (error) {
        console.error('❌ [NBackGame] Ошибка проверки статуса:', error);
      }
    };

    checkAndStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Автозапуск игры когда статус уже playing
  const autoStartGame = useCallback(async (data: any) => {
    if (gameStartedRef.current) return;
    gameStartedRef.current = true;

    try {
      const sequenceResponse = await fetch(`/api/game/${sessionId}/sequence`);
      if (!sequenceResponse.ok) throw new Error('Ошибка получения последовательности');

      const sequenceData = await sequenceResponse.json();
      setSequence(sequenceData.sequence);
      sequenceRef.current = sequenceData.sequence;

      setGameStatus('playing');
      setCorrectAnswers(0);
      setErrors(0);
      setDisplayStep(0);
      setActivePosition(null);
      stepRef.current = 0;
      hasAnsweredForStepRef.current.clear();
      isProcessingAnswerRef.current = false;

      await loadPlayerStats();

      setTimeout(() => {
        runGameLoop();
      }, 500);
    } catch (error) {
      console.error('❌ [autoStartGame] Ошибка:', error);
      gameStartedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, loadPlayerStats, runGameLoop]);

  // Загрузка статистики при старте игры
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (gameStatus === 'playing') {
      // Загружаем сразу и запускаем интервал
      const loadAndSchedule = () => {
        loadPlayerStats();
        interval = setInterval(loadPlayerStats, 3000);
      };
      loadAndSchedule();
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      gameStartedRef.current = false;
    };
  }, []);

  // Рендер состояния ожидания
  if (gameStatus === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Готов к тренировке?</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            N-значение: <span className="font-medium">{nValue}</span>
          </p>
          <button
            onClick={startGame}
            className="mt-5 h-10 rounded-lg bg-gray-900 dark:bg-white px-6 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            Начать игру
          </button>
        </div>
      </div>
    );
  }

  // Рендер состояния игры
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Модальное окно подтверждения выхода */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Выйти из игры?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ваш прогресс будет потерян. Текущий счет: {correctAnswers} правильных, {errors} ошибок.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelExit}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Остаться
              </button>
              <button
                onClick={confirmExit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка выхода */}
      <button
        onClick={handleExit}
        className="self-start px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition"
      >
        ❌ Выйти
      </button>

      {/* Статистика */}
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">Шаг</div>
            <div className="text-lg font-semibold">{displayStep + 1} <span className="text-xs text-gray-400">/ {sequence.length}</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">Правильно</div>
            <div className="text-lg font-semibold text-green-600">{correctAnswers}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-gray-400">Ошибки</div>
            <div className="text-lg font-semibold text-red-600">{errors}</div>
          </div>
        </div>
        <div className="mt-3 flex justify-center gap-4 text-xs text-gray-500">
          <span>Скорость: <strong>{currentSpeedMs}мс</strong></span>
          <span>N: <strong>{nValue}</strong></span>
        </div>
      </div>

      {/* Сетка */}
      <Grid3x3
        activePosition={activePosition}
        onPositionClick={() => {}}
        disabled={gameStatus !== 'playing'}
      />

      {/* Кнопка */}
      <button
        onClick={handleMatchClick}
        disabled={gameStatus !== 'playing' || activePosition === null}
        className={`h-14 w-full max-w-xs rounded-lg text-base font-semibold transition ${
          gameStatus === 'playing' && activePosition !== null
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {gameStatus === 'playing' && activePosition !== null ? 'Совпадение' : 'Ожидание...'}
      </button>

      {/* Фидбек */}
      {feedback && (
        <div className={`px-5 py-2 rounded-md text-sm font-semibold ${
          feedback === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {feedback === 'correct' ? 'Верно' : 'Ошибка'}
        </div>
      )}

      {/* Ускорение */}
      {speedIncreaseNotification && (
        <div className="px-5 py-2 rounded-md text-sm font-semibold bg-amber-100 text-amber-700">
          Скорость увеличена
        </div>
      )}

      {/* Лидерборд */}
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Игроки</h3>
        <div className="mt-3 space-y-2">
          {players.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-2">Загрузка...</div>
          ) : (
            players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  player.id === playerId ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                  <span className="truncate">{player.name || (player.isBot ? 'Бот' : 'Игрок')}</span>
                  {player.isBot && <span className="text-[10px] text-gray-400">бот</span>}
                  {player.id === playerId && <span className="text-[10px] text-gray-500">ты</span>}
                </div>
                <div className="flex gap-3 shrink-0 text-xs">
                  <span className="text-green-600">{player.correctAnswers}</span>
                  <span className="text-red-600">{player.errors}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Нажми кнопку, если текущая позиция совпадает с позицией {nValue} шагов назад
      </p>
    </div>
  );
};
