'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { io, Socket } from 'socket.io-client';

interface TournamentPlayer {
  id: string;
  tournamentId: string;
  userId: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  joinedAt: string;
}

interface Tournament {
  id: string;
  name: string;
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  maxRounds: number;
  currentRound: number;
  status: 'waiting' | 'playing' | 'finished';
  minPlayers: number;
  maxPlayers: number;
  hostId: string;
  createdAt: string;
  players: TournamentPlayer[];
}

export default function TournamentPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { data: session } = useSession();
  const router = useRouter();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Инициализация Socket.IO
  useEffect(() => {
    if (!session?.user) return;

    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ [Socket] Connected to tournament server');
    });

    newSocket.on('tournament:update', (data: { tournament: Tournament }) => {
      setTournament(data.tournament);
      
      const currentPlayer = data.tournament.players.find(p => p.userId === session.user.id);
      if (currentPlayer) {
        setIsHost(currentPlayer.isHost);
        setIsReady(currentPlayer.isReady);
      }
    });

    newSocket.on('tournament:player-joined', (data: { player: TournamentPlayer }) => {
      console.log('👤 [Tournament] Player joined:', data.player.name);
    });

    newSocket.on('tournament:player-left', (data: { playerId: string }) => {
      console.log('🚪 [Tournament] Player left');
    });

    newSocket.on('tournament:player-ready', (data: { playerId: string; isReady: boolean }) => {
      console.log('✅ [Tournament] Player ready:', data.playerId, data.isReady);
    });

    newSocket.on('tournament:countdown', (data: { seconds: number }) => {
      console.log('⏱️ [Tournament] Countdown:', data.seconds);
      setCountdown(data.seconds);
    });

    newSocket.on('tournament:start-game', (data: { sessionId: string }) => {
      console.log('🎮 [Tournament] Game starting:', data.sessionId);
      router.push(`/tournament/${tournamentId}/round/1?sessionId=${data.sessionId}`);
    });

    newSocket.on('tournament:error', (data: { message: string }) => {
      console.error('❌ [Tournament] Error:', data.message);
      setError(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [session, router, tournamentId]);

  // Загрузка данных турнира
  useEffect(() => {
    if (!session?.user || !tournamentId) return;

    fetchTournamentData();
    setIsLoading(false);
  }, [session, tournamentId]);

  const fetchTournamentData = async () => {
    try {
      const response = await fetch(`/api/tournament/${tournamentId}`);
      const data = await response.json();
      
      if (data.success) {
        setTournament(data.tournament);
        
        const currentPlayer = data.tournament.players.find(p => p.userId === session.user.id);
        if (currentPlayer) {
          setIsHost(currentPlayer.isHost);
          setIsReady(currentPlayer.isReady);
        }
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
    }
  };

  const handleToggleReady = () => {
    if (!socket || !session?.user) return;

    const newReadyState = !isReady;
    setIsReady(newReadyState);

    socket.emit('tournament:ready', {
      tournamentId,
      userId: session.user.id,
      isReady: newReadyState,
    });
  };

  const handleStartTournament = () => {
    if (!socket || !session?.user) return;

    socket.emit('tournament:start', {
      tournamentId,
      hostId: session.user.id,
    });
  };

  const handleLeaveTournament = () => {
    if (!socket || !session?.user) return;

    socket.emit('tournament:leave', {
      tournamentId,
      userId: session.user.id,
    });

    router.push('/tournaments');
  };

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Требуется авторизация
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Пожалуйста, войдите в систему.
        </p>
      </div>
    );
  }

  if (isLoading || !tournament) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const allReady = tournament.players.every(p => p.isReady);
  const enoughPlayers = tournament.players.length >= tournament.minPlayers;
  const canStart = isHost && allReady && enoughPlayers && countdown === null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                {tournament.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Ожидание игроков...</p>
            </div>
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-sm font-medium text-purple-700 dark:text-purple-300">
              {tournament.players.length}/{tournament.maxPlayers} игроков
            </div>
          </div>

          {countdown !== null && (
            <div className="mb-6 p-6 text-center bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl">
              <div className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
                {countdown}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Начало игры...</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-center">
              <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">N-значение</div>
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{tournament.nValue}</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-center">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Раундов</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{tournament.maxRounds}</div>
            </div>
            <div className="p-4 rounded-xl bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 text-center">
              <div className="text-sm text-pink-600 dark:text-pink-400 mb-1">Шагов</div>
              <div className="text-2xl font-bold text-pink-700 dark:text-pink-300">{tournament.totalSteps}</div>
            </div>
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Скорость</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{tournament.baseSpeedMs}ms</div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleToggleReady}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                isReady
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } shadow-lg`}
            >
              {isReady ? '✅ Готов' : '❌ Не готов'}
            </button>

            {isHost && (
              <button
                onClick={handleStartTournament}
                disabled={!canStart}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all disabled:cursor-not-allowed"
              >
                🚀 Начать турнир
              </button>
            )}

            <button
              onClick={handleLeaveTournament}
              className="px-6 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-pink-200 dark:border-pink-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:bg-pink-50 dark:hover:bg-pink-900/20"
            >
              Выйти
            </button>
          </div>

          {!isHost && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              Ожидание начала игры от хоста...
            </p>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Список игроков */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <span>👥</span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Игроки</span>
          </h3>
          <div className="space-y-3">
            {tournament.players.map((player, index) => (
              <div
                key={player.id}
                className={`flex justify-between items-center p-4 rounded-xl transition-all ${
                  player.userId === session.user.id
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700'
                    : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">
                    {player.isHost ? '👑' : `${index + 1}.`}
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {player.name}
                      {player.userId === session.user.id && ' (Вы)'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    player.isReady
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {player.isReady ? '✅ Готов' : '❌ Не готов'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {tournament.players.length < tournament.minPlayers && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                🎯 Нужно минимум {tournament.minPlayers} игрока для начала. Сейчас: {tournament.players.length}
              </p>
            </div>
          )}
        </div>

        {/* Информация о турнире */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">ℹ️ Информация</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>ID турнира:</span>
              <span className="font-mono">{tournament.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Создан:</span>
              <span>{new Date(tournament.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Минимум игроков:</span>
              <span>{tournament.minPlayers}</span>
            </div>
            <div className="flex justify-between">
              <span>Максимум игроков:</span>
              <span>{tournament.maxPlayers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
