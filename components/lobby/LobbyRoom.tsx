'use client';

import { useEffect, useState } from 'react';
import { useLobby } from '@/contexts/LobbyContext';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Lobby } from '@/types/lobby';

interface LobbyRoomProps {
  lobbyId: string;
}

export const LobbyRoom: React.FC<LobbyRoomProps> = ({ lobbyId }) => {
  const { data: session } = useSession();
  const { 
    currentLobby, 
    isConnected, 
    isLoading, 
    error,
    leaveLobby,
    setReady,
    startGame,
  } = useLobby();
  
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  useEffect(() => {
    if (!currentLobby && !isLoading) {
      // Лобби не найдено, возвращаемся назад
      router.push('/lobbies');
    }
  }, [currentLobby, isLoading, router]);

  // Проверка для автозапуска
  useEffect(() => {
    if (!currentLobby || currentLobby.status !== 'waiting' || !autoStartEnabled) return;
    
    const hasMinPlayers = currentLobby.currentPlayers >= currentLobby.minPlayers;
    const allReady = currentLobby.players.every((p: LobbyPlayer) => p.isReady);
    
    if (hasMinPlayers && allReady) {
      // Достаточное количество игроков и все готовы - запускаем игру
      startGame(currentLobby.id);
    }
  }, [currentLobby?.id, currentLobby?.currentPlayers, currentLobby?.players, autoStartEnabled, startGame]);

  const handleReady = async () => {
    if (!currentLobby) return;
    
    // Получаем текущий статус (предполагаем что пользователь уже в лобби)
    const player = currentLobby.players.find((p: LobbyPlayer) => p.userId === session?.user?.id);
    if (!player) return;

    setReady(currentLobby.id, !player.isReady);
  };

  const handleStart = () => {
    if (!currentLobby) return;
    setShowStartModal(true);
  };

  const confirmStartGame = () => {
    if (!currentLobby) return;
    setShowStartModal(false);
    startGame(currentLobby.id);
  };

  const toggleAutoStart = () => {
    if (!currentLobby) return;
    const newAutoStart = !autoStartEnabled;
    setAutoStartEnabled(newAutoStart);
    startGame(currentLobby.id); // Отправляем на сервер
  };

  const handleLeave = async () => {
    if (!currentLobby) return;
    
    try {
      await fetch(`/api/lobby/${lobbyId}/leave`, {
        method: 'POST',
      });
      leaveLobby(lobbyId);
      router.push('/lobbies');
    } catch (error) {
      console.error('Error leaving lobby:', error);
      setLocalError('Не удалось покинуть лобби');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-xl text-gray-700 dark:text-gray-300">
            Загрузка лобби...
          </p>
        </div>
      </div>
    );
  }

  if (!currentLobby) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Лобби не найдено
          </p>
          <button
            onClick={() => router.push('/lobbies')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const isHost = currentLobby.players.some(
    p => p.userId === session?.user?.id && p.isHost
  );
  
  const myPlayer = currentLobby.players.find((p: LobbyPlayer) => p.userId === session?.user?.id);
  const isReady = myPlayer?.isReady || false;
  const allReady = currentLobby.players.every((p: LobbyPlayer) => p.isReady);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-block w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Подключено' : 'Отключено'}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          {currentLobby.name}
        </h1>
        <div className="flex gap-4 mt-4 text-lg text-gray-600 dark:text-gray-400">
          <span>🎯 N-{currentLobby.nValue}</span>
          <span>⚡ {currentLobby.baseSpeedMs}ms</span>
          <span>👥 {currentLobby.currentPlayers}/{currentLobby.maxPlayers}</span>
        </div>
      </div>

      {/* Ошибки */}
      {(error || localError) && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg">
          {error || localError}
          <button
            onClick={() => {
              setLocalError(null);
              // error из контекста очищается автоматически
            }}
            className="float-right text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Модальное окно подтверждения запуска */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Начать игру?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Вы уверены, что хотите начать игру? Вы можете подождать других игроков или включить автозапуск при достижении минимального количества игроков.
            </p>
            
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={autoStartEnabled}
                  onChange={() => setAutoStartEnabled(!autoStartEnabled)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    Автозапуск при достижении минимума
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Игра начнется автоматически когда соберется минимум {currentLobby.minPlayers} игроков и все нажмут «Готов»
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowStartModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmStartGame}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Начать игру
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown */}
      {currentLobby.status === 'countdown' && (
        <div className="mb-8 text-center py-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <p className="text-6xl font-bold text-blue-600 dark:text-blue-400">
            {countdown || 5}
          </p>
          <p className="text-xl text-blue-700 dark:text-blue-300 mt-2">
            Игра начинается!
          </p>
        </div>
      )}

      {/* Игроки */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Игроки
        </h2>
        <div className="space-y-3">
          {currentLobby.players.map((player) => (
            <div
              key={player.userId}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {player.name}
                    {player.isHost && (
                      <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                        Хост
                      </span>
                    )}
                    {player.userId === session?.user?.id && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        Вы
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  player.isReady
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {player.isReady ? '✓ Готов' : 'Ожидает'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопки управления */}
      {myPlayer && (
        <div className="flex gap-4">
          <button
            onClick={handleReady}
            disabled={currentLobby.status !== 'waiting'}
            className={`flex-1 py-4 rounded-lg font-semibold text-lg transition-colors ${
              isReady
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isReady ? 'Не готов' : 'Готов'}
          </button>

          {isHost && (
            <>
              <button
                onClick={handleStart}
                disabled={currentLobby.status !== 'waiting'}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🚀 Начать игру
              </button>

              {/* Кнопка автозапуска */}
              <button
                onClick={toggleAutoStart}
                className={`px-6 py-4 rounded-lg font-semibold text-lg transition-colors ${
                  autoStartEnabled
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Автозапуск при достижении минимального количества игроков"
              >
                {autoStartEnabled ? '✓ Автозапуск' : '⚡ Автозапуск'}
              </button>
            </>
          )}

          <button
            onClick={handleLeave}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Выйти
          </button>
        </div>
      )}

      {/* Информация о статусе */}
      {currentLobby.status === 'waiting' && !allReady && (
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Дождитесь пока все игроки нажмут «Готов» ({currentLobby.currentPlayers}/{currentLobby.minPlayers} минимум)
        </p>
      )}

      {currentLobby.status === 'waiting' && allReady && isHost && currentLobby.currentPlayers >= currentLobby.minPlayers && (
        <p className="mt-4 text-center text-green-600 dark:text-green-400 font-semibold">
          Все игроки готовы! Нажмите «Начать игру»
        </p>
      )}

      {currentLobby.status === 'waiting' && !allReady && currentLobby.currentPlayers < currentLobby.minPlayers && (
        <p className="mt-4 text-center text-orange-600 dark:text-orange-400 font-semibold">
          Ожидание игроков... Нужно минимум {currentLobby.minPlayers}, сейчас {currentLobby.currentPlayers}
        </p>
      )}

      {autoStartEnabled && currentLobby.status === 'waiting' && (
        <p className="mt-4 text-center text-purple-600 dark:text-purple-400 font-semibold">
          ✓ Автозапуск включен. Игра начнется когда соберется минимум {currentLobby.minPlayers} игроков и все нажмут «Готов»
        </p>
      )}
    </div>
  );
};
