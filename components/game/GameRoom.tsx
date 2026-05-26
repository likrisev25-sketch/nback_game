// Файл: GameRoom.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Grid3x3 } from './Grid3x3';
import { io, Socket } from 'socket.io-client';

interface GameRoomProps {
  lobbyId: string;
  nValue: number;
  baseSpeedMs: number;
  totalSteps: number;
  onGameEnd: (correctAnswers: number, errors: number) => void;
  onBackToLobby: () => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({
  lobbyId,
  nValue,
  baseSpeedMs,
  totalSteps,
  onGameEnd,
  onBackToLobby,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Состояние игры
  const [sequence, setSequence] = useState<number[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [currentSpeedMs, setCurrentSpeedMs] = useState(baseSpeedMs);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [speedIncreaseNotification, setSpeedIncreaseNotification] = useState(false);
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
  const hasAnsweredForStepRef = useRef<Map<number, boolean>>(new Map());
  const gameStartedRef = useRef<boolean>(false);
  const sequenceRef = useRef<number[]>([]);
  const speedRef = useRef<number>(baseSpeedMs);
  const nValueRef = useRef<number>(nValue);

  // Инициализация Socket.IO
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ [Socket] Connected to game server');
    });

    newSocket.on('game:session-created', (data: { sessionId: string }) => {
      console.log('🎮 [Socket] Game session created:', data.sessionId);
      setSessionId(data.sessionId);
    });

    newSocket.on('game:update', (data: { players: Array<{
      id: string;
      name: string;
      correctAnswers: number;
      errors: number;
      isBot: boolean;
    }> }) => {
      setPlayers(data.players.map(p => ({
        id: p.id,
        name: p.name || (p.isBot ? 'Бот' : 'Игрок'),
        correctAnswers: p.correctAnswers,
        errors: p.errors,
        isBot: p.isBot,
      })));
    });

    newSocket.on('game:answer-processed', (data: {
      playerId: string;
      isCorrect: boolean;
      correctAnswers: number;
      errors: number;
      newSpeedMs?: number;
    }) => {
      if (data.playerId === 'local') {
        setCorrectAnswers(data.correctAnswers);
        setErrors(data.errors);
        
        if (data.newSpeedMs) {
          setCurrentSpeedMs(data.newSpeedMs);
          speedRef.current = data.newSpeedMs;
          setSpeedIncreaseNotification(true);
          setTimeout(() => setSpeedIncreaseNotification(false), 3000);
        }
        
        setFeedback(data.isCorrect ? 'correct' : 'wrong');
        setTimeout(() => setFeedback(null), 500);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Отправка ответа игрока
  const sendAnswer = useCallback(async (stepNumber: number, playerAnswer: boolean, position: number) => {
    if (!sessionId) return;
    
    // Проверяем, не отправлял ли уже ответ для этого шага
    if (hasAnsweredForStepRef.current.get(stepNumber)) {
      return;
    }
    
    hasAnsweredForStepRef.current.set(stepNumber, true);
    
    try {
      const response = await fetch(`/api/game/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          playerId: 'local',
          position,
          stepNumber,
          playerAnswer,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }
      
      const data = await response.json();
      
      if (socket) {
        socket.emit('game:answer-submitted', {
          sessionId,
          isCorrect: data.isCorrect,
          correctAnswers: data.correctAnswers,
          errors: data.errors,
          newSpeedMs: data.newSpeedMs,
        });
      }
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      hasAnsweredForStepRef.current.delete(stepNumber);
    }
  }, [sessionId, socket]);

  // Обработка нажатия на кнопку "Совпадение"
  const handleMatchClick = useCallback(() => {
    if (gameStatus !== 'playing' || activePosition === null) {
      return;
    }
    
    const currentStep = stepRef.current;
    
    if (hasAnsweredForStepRef.current.get(currentStep)) {
      return;
    }
    
    const position = activePosition;
    sendAnswer(currentStep, true, position);
  }, [sendAnswer, gameStatus, activePosition]);

  // Игровой цикл
  const runGameLoop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    const currentStep = stepRef.current;
    
    if (currentStep >= sequenceRef.current.length) {
      endGame();
      return;
    }
    
    const position = sequenceRef.current[currentStep];
    
    setActivePosition(position);
    setDisplayStep(currentStep);
    setFeedback(null);
    
    // Планируем следующий шаг
    timerRef.current = setTimeout(() => {
      setActivePosition(null);
      stepRef.current += 1;
      runGameLoop();
    }, speedRef.current);
  }, []);

  // Функция для завершения игры
  const endGame = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setGameStatus('finished');
    gameStartedRef.current = false;
    
    setTimeout(() => {
      onGameEnd(correctAnswers, errors);
    }, 1000);
  }, [correctAnswers, errors, onGameEnd]);

  // Выход из игры
  const handleExit = useCallback(() => {
    setShowExitConfirm(true);
  }, []);

  const confirmExit = useCallback(() => {
    setShowExitConfirm(false);
    onBackToLobby();
  }, [onBackToLobby]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
  }, []);

  // Запуск игры
  const startGame = useCallback(async () => {
    if (gameStartedRef.current) {
      return;
    }
    
    gameStartedRef.current = true;
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    stepRef.current = 0;
    hasAnsweredForStepRef.current.clear();
    
    try {
      // Создаем игровую сессию
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Лобби ${lobbyId}`,
          nValue,
          totalSteps,
          baseSpeedMs,
          maxPlayers: 2,
          addBot: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка создания игры');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      
      // Получаем последовательность
      const sequenceResponse = await fetch(`/api/game/${data.sessionId}/sequence`);
      const sequenceData = await sequenceResponse.json();
      
      setGameStatus('playing');
      setSequence(sequenceData.sequence);
      sequenceRef.current = sequenceData.sequence;
      setCorrectAnswers(0);
      setErrors(0);
      setDisplayStep(0);
      setActivePosition(null);
      
      setTimeout(() => {
        runGameLoop();
      }, 500);
      
    } catch (error) {
      console.error('Ошибка начала игры:', error);
      alert('Ошибка начала игры: ' + (error as Error).message);
      setGameStatus('waiting');
      gameStartedRef.current = false;
    }
  }, [lobbyId, nValue, totalSteps, baseSpeedMs, runGameLoop]);

  // При монтировании начинаем игру
  useEffect(() => {
    startGame();
  }, [startGame]);

  // Рендер состояния ожидания
  if (gameStatus === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Готов к игре?</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            N-значение: <span className="font-medium">{nValue}</span>
          </p>
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
            <div className="text-lg font-semibold">{displayStep + 1} <span className="text-xs text-gray-400">/ {totalSteps}</span></div>
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

      <p className="text-xs text-gray-400 text-center">
        Нажми кнопку, если текущая позиция совпадает с позицией {nValue} шагов назад
      </p>
    </div>
  );
};
