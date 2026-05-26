// Файл: GameLobby.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Player {
  id: string;
  name: string;
  isBot: boolean;
  isHost: boolean;
  correctAnswers: number;
  errors: number;
}

interface GameSession {
  id: string;
  name: string;
  nValue: number;
  status: string;
  maxPlayers: number;
}

interface GameLobbyProps {
  sessionId: string;
  playerId: string;
  onStart: () => void;
  onExit: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({ sessionId, playerId, onStart, onExit }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const fetchLobbyData = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/${sessionId}/stats`);
      if (!response.ok) throw new Error('Ошибка загрузки');

      const data = await response.json();
      if (!isMounted.current) return;

      setSession(data.session);
      setPlayers(data.players);

      const me = data.players.find((p: Player) => p.id === playerId);
      setIsHost(me?.isHost || false);

      // Если игра уже началась на сервере — сразу переходим
      if (data.session.status === 'playing') {
        onStart();
      }
    } catch (err) {
      if (isMounted.current) setError('Не удалось загрузить данные лобби');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [sessionId, playerId, onStart]);

  useEffect(() => {
    isMounted.current = true;
    fetchLobbyData();

    intervalRef.current = setInterval(fetchLobbyData, 3000);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLobbyData]);

  const handleStartGame = async () => {
    if (!isHost || starting) return;
    setStarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/game/${sessionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка запуска');
      }

      onStart();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setStarting(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(sessionId)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => alert('Не удалось скопировать ID'));
  };

  const handleExit = () => {
    if (window.confirm('Вы действительно хотите выйти?')) {
      onExit();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка лобби...</p>
      </div>
    );
  }

  const currentCount = players.length;
  const maxCount = session?.maxPlayers || 2;
  const isFull = currentCount >= maxCount;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {session?.name || 'Игра'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            N={session?.nValue} · Ожидание игроков
          </p>
        </div>

        {/* ID игры для приглашения */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">
            Пригласите друзей, отправив им ID игры:
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white dark:bg-gray-900 px-4 py-2.5 rounded-lg text-sm font-mono break-all border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200">
              {sessionId}
            </code>
            <button
              onClick={handleCopyId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shrink-0"
            >
              {copied ? '✓ Скопировано' : '📋 Копировать'}
            </button>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Счетчик игроков */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Игроки</span>
            <span className={`text-sm font-bold ${isFull ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {currentCount} / {maxCount}
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((currentCount / maxCount) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Список игроков */}
        <div className="space-y-3 mb-8">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl border ${
                player.id === playerId
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {player.name}
                    {player.id === playerId && (
                      <span className="ml-2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">Вы</span>
                    )}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    {player.isHost && (
                      <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded font-medium">Создатель</span>
                    )}
                    {player.isBot && (
                      <span className="text-[10px] bg-gray-500 text-white px-1.5 py-0.5 rounded font-medium">Бот</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-green-600 dark:text-green-400 text-lg">✓</div>
            </div>
          ))}

          {/* Плейсхолдеры для свободных слотов */}
          {Array.from({ length: Math.max(0, maxCount - currentCount) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-between p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 text-lg">
                  +
                </div>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Ожидание игрока...</p>
              </div>
            </div>
          ))}
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={starting}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {starting ? 'Запуск...' : isFull ? '🚀 Начать игру' : `Начать игру (${currentCount}/${maxCount})`}
            </button>
          ) : (
            <div className="w-full py-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-center">
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {isFull ? 'Все игроки собраны! Ожидание создателя...' : 'Ожидание других игроков...'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Только создатель игры может начать игру
              </p>
            </div>
          )}

          <button
            onClick={handleExit}
            className="w-full py-3 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl font-semibold transition-colors"
          >
            Выйти из игры
          </button>
        </div>

        {/* Подсказка */}
        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          {isHost
            ? 'Вы можете начать игру в любой момент или дождаться максимального количества игроков'
            : 'Игра начнется, когда создатель нажмет «Начать игру» или когда соберется максимум игроков'}
        </p>
      </div>
    </div>
  );
};
