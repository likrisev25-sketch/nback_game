'use client';

import { useEffect, useState } from 'react';
import { useLobby } from '@/contexts/LobbyContext';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Lobby, LobbyPlayer } from '@/types/lobby';
import { GameRoom } from '@/components/game/GameRoom';

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
    refreshLobby,
  } = useLobby();
  
  const router = useRouter();
  const [localError, setLocalError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Загружаем лобби при монтировании
  useEffect(() => {
    if (lobbyId) {
      refreshLobby(lobbyId);
      
      // Polling для обновления статуса
      const interval = setInterval(() => {
        refreshLobby(lobbyId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [lobbyId, refreshLobby]);

  // Проверяем является ли пользователь хостом
  useEffect(() => {
    if (currentLobby && session?.user) {
      const host = currentLobby.players.find(p => p.userId === session.user.id && p.isHost);
      setIsHost(!!host);
      
      // Если хост и лобби только что создано (все готовы кроме возможно хоста), автоматически начинаем
      if (host && currentLobby.status === 'waiting' && !gameStarted) {
        const readyCount = currentLobby.players.filter(p => p.isReady).length;
        if (readyCount >= currentLobby.minPlayers - 1) {
          // Хост автоматически становится готовым и начинает игру
          setTimeout(async () => {
            await setReady(currentLobby.id, session.user.id, true);
            setTimeout(() => {
              startGame(currentLobby.id, session.user.id);
            }, 500);
          }, 1000);
        }
      }
    }
  }, [currentLobby, session, gameStarted]);

  useEffect(() => {
    if (!currentLobby && !isLoading) {
      router.push('/lobbies');
    }
  }, [currentLobby, isLoading, router]);

  const handleReady = async () => {
    if (!currentLobby || !session?.user) return;
    
    const player = currentLobby.players.find((p: LobbyPlayer) => p.userId === session.user.id);
    if (!player) return;

    await setReady(currentLobby.id, session.user.id, !player.isReady);
    refreshLobby(currentLobby.id);
  };

  const handleLeave = async () => {
    if (!currentLobby || !session?.user) return;
    
    try {
      await leaveLobby(currentLobby.id, session.user.id);
      router.push('/lobbies');
    } catch (error) {
      console.error('Error leaving lobby:', error);
      setLocalError('Не удалось покинуть лобби');
    }
  };

  const handleGameEnd = (correctAnswers: number, errors: number) => {
    console.log('Игра окончена:', { correctAnswers, errors });
    setGameStarted(false);
    refreshLobby(lobbyId);
  };

  const handleBackToLobby = () => {
    setGameStarted(false);
    refreshLobby(lobbyId);
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

  const myPlayer = currentLobby.players.find((p: LobbyPlayer) => p.userId === session?.user?.id);
  const isReadyState = myPlayer?.isReady || false;
  const allReady = currentLobby.players.every((p: LobbyPlayer) => p.isReady);
  const isHostLocal = currentLobby.players.some(
    p => p.userId === session?.user?.id && p.isHost
  );

  // Показываем игру если статус 'in_progress' или gameStarted
  if (currentLobby.status === 'in_progress' || gameStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GameRoom
          lobbyId={lobbyId}
          nValue={currentLobby.nValue}
          baseSpeedMs={currentLobby.baseSpeedMs}
          totalSteps={30}
          onGameEnd={handleGameEnd}
          onBackToLobby={handleBackToLobby}
        />
      </div>
    );
  }

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
            }}
            className="float-right text-lg font-bold"
          >
            ×
          </button>
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
              isReadyState
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {isReadyState ? 'Не готов' : 'Готов'}
          </button>

          {isHostLocal && (
            <button
              onClick={async () => {
                if (!session?.user) return;
                await startGame(currentLobby.id, session.user.id);
              }}
              disabled={currentLobby.status !== 'waiting'}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              🚀 Начать игру
            </button>
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

      {currentLobby.status === 'waiting' && allReady && isHostLocal && currentLobby.currentPlayers >= currentLobby.minPlayers && (
        <p className="mt-4 text-center text-green-600 dark:text-green-400 font-semibold">
          Все игроки готовы! Игра начнётся автоматически...
        </p>
      )}
    </div>
  );
};
