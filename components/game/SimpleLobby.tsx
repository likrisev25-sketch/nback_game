'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';
import { getUserName, setUserName } from '@/lib/auth-simple';
import { NBackGame } from './NBackGame';

export function SimpleLobby() {
  const [sessionId, setSessionId] = useState('');
  const [gameName, setGameName] = useState('Моя игра');
  const [userName, setUserNameState] = useState(getUserName());
  const [showCreate, setShowCreate] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [nValue, setNValue] = useState(2);
  
  const createSession = trpc.gameSimple.createSession.useMutation({
    onSuccess: (data) => {
      console.log('✅ Сессия создана:', data);
      alert(`Сессия создана! ID: ${data.sessionId}`);
      setSessionId(data.sessionId);
      setShowCreate(false);
    },
    onError: (error) => {
      console.error('❌ Ошибка создания сессии:', error);
      alert(`Ошибка: ${error.message}`);
    }
  });
  
  const joinSession = trpc.gameSimple.joinSession.useMutation({
    onSuccess: () => {
      alert('Вы присоединились!');
      setShowCreate(false);
    },
    onError: (error) => alert(`Ошибка: ${error.message}`)
  });
  
  const sessionData = trpc.gameSimple.getSession.useQuery(
    { sessionId },
    { 
      enabled: !!sessionId && !showCreate, 
      refetchInterval: 2000
    }
  );
  
  // Сохраняем playerId текущего игрока при обновлении данных сессии
  useEffect(() => {
    if (sessionData.data) {
      const currentPlayer = sessionData.data.players?.find(p => p.name === userName);
      if (currentPlayer) {
        setPlayerId(currentPlayer.id);
        setNValue(sessionData.data.nValue || 2);
      }
    }
  }, [sessionData.data, userName, setPlayerId, setNValue]);
  
  const listSessions = trpc.gameSimple.listSessions.useQuery(undefined, {
    refetchInterval: 3000
  });
  
  const startGame = trpc.gameSimple.startGame.useMutation({
    onSuccess: (data) => {
      alert('Игра началась!');
      // Перезагрузить данные сессии и получить playerId
      sessionData.refetch();
      // Находим playerId текущего игрока
      const currentPlayer = sessionData.data?.players?.find(p => p.name === userName);
      if (currentPlayer) {
        setPlayerId(currentPlayer.id);
        setNValue(sessionData.data?.nValue || 2);
        setShowGame(true);
      }
    },
    onError: (error) => alert(`Ошибка: ${error.message}`)
  });
  
  const isHost = sessionData.data?.players?.some(p => p.name === userName);
  
  // Обработчик завершения игры
  const handleGameComplete = (correctAnswers: number, errors: number) => {
    console.log('🏁 Игра завершена:', { correctAnswers, errors });
    setShowGame(false);
    setShowCreate(true);
    setSessionId('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          N-Back Game
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Тренируй рабочую память
        </p>
        
        {/* Настройка имени */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ваше имя:
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => {
              setUserNameState(e.target.value);
              setUserName(e.target.value);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        
        {showCreate ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Создание игры */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                Создать игру
              </h2>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Название игры"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              />
              <button
                onClick={() => {
                  console.log('🔵 Кнопка "Создать лобби" нажата');
                  console.log('🔵 gameName:', gameName);
                  createSession.mutate({
                    name: gameName,
                    nValue: 2,
                    totalSteps: 30,
                    baseSpeedMs: 1500
                  });
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:bg-gray-400"
                disabled={createSession.isPending}
              >
                {createSession.isPending ? 'Создание...' : '🎮 Создать лобби'}
              </button>
            </div>
            
            {/* Список игр */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                Доступные игры
              </h2>
              {listSessions.isLoading ? (
                <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
              ) : listSessions.data?.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">Нет активных игр</p>
              ) : (
                <div className="space-y-3">
                  {listSessions.data?.map((session: any) => (
                    <div
                      key={session.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {session.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {session.players?.length || 0} игроков
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSessionId(session.id);
                          joinSession.mutate({ sessionId: session.id });
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
                      >
                        Присоединиться
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Информация о сессии */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {sessionData.data?.name || 'Сессия'}
              </h2>
              <button
                onClick={() => {
                  setShowCreate(true);
                  setSessionId('');
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
              >
                ← Назад
              </button>
            </div>
            
            {sessionData.isLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Статус</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                      {sessionData.data?.status}
                    </p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Игроков</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">
                      {sessionData.data?.players?.length || 0}
                    </p>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white">
                  Игроки:
                </h3>
                <ul className="space-y-2 mb-6">
                  {sessionData.data?.players?.map((player: any) => (
                    <li
                      key={player.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                    >
                      <span className="text-gray-800 dark:text-white">
                        {player.name}
                        {player.isHost && (
                          <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                            Хост
                          </span>
                        )}
                        {player.name === userName && (
                          <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                            Вы
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {sessionData.data?.status === 'waiting' && isHost && (
                  <button
                    onClick={() => startGame.mutate({ sessionId })}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
                  >
                    🚀 Начать игру
                  </button>
                )}
                
                {sessionData.data?.status === 'playing' && (
                  <button
                    onClick={() => setShowGame(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
                  >
                    🎮 Продолжить игру
                  </button>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Компонент игры */}
        {showGame && sessionId && playerId && (
          <div className="mt-6">
            <NBackGame
              sessionId={sessionId}
              playerId={playerId}
              nValue={nValue}
              onComplete={handleGameComplete}
              onError={(error) => {
                console.error('Ошибка в игре:', error);
                alert('Ошибка в игре: ' + error.message);
                setShowGame(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
