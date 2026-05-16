'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Tournament {
  id: string;
  name: string;
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  maxRounds: number;
  currentRound: number;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

interface TournamentPlayer {
  id: string;
  tournamentId: string;
  userId: string;
  totalCorrectAnswers: number;
  totalErrors: number;
  roundWins: number;
  isBot: boolean;
  botAccuracy?: number;
  joinedAt: string;
}

export default function TournamentGamePage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [gameSession, setGameSession] = useState<{ sessionId: string; playerId: string; currentRound: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка данных турнира при монтировании
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTournament(data.tournament);
        setPlayers(data.players);
        setGameSession({
          sessionId: data.sessionId,
          playerId: data.playerId,
          currentRound: data.currentRound || 1,
        });
      } catch (error) {
        console.error('Ошибка парсинга данных турнира:', error);
      }
    }
    setLoading(false);
  }, [tournamentId]);

  const handleStartRound = () => {
    if (!gameSession || !tournament) return;
    const roundNumber = gameSession.currentRound;
    console.log('🏆 [handleStartRound] Запускаем раунд:', roundNumber);
    console.log('🏆 [handleStartRound] sessionId:', gameSession.sessionId);
    console.log('🏆 [handleStartRound] playerId:', gameSession.playerId);
    router.push(`/tournament/${tournamentId}/round/${roundNumber}?sessionId=${gameSession.sessionId}&playerId=${gameSession.playerId}`);
  };

  const handleExit = () => {
    if (confirm('Вы действительно хотите выйти из турнира? Прогресс будет потерян.')) {
      sessionStorage.removeItem(`tournament_${tournamentId}`);
      router.push('/tournament');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center">
      <div className="text-2xl">Загрузка турнира...</div>
    </div>
  );

  if (!tournament || !gameSession) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center">
      <div className="text-2xl">Турнир не найден</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{tournament.name}</h2>
            <div className="text-sm">Раунд <strong className="text-xl">{gameSession.currentRound}</strong> / {tournament.maxRounds}</div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">N-значение</div>
              <div className="text-2xl font-bold">{tournament.nValue}</div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Шагов</div>
              <div className="text-2xl font-bold">{tournament.totalSteps}</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Статус</div>
              <div className="text-2xl font-bold capitalize">{tournament.status}</div>
            </div>
          </div>

          <button
            onClick={handleStartRound}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg font-bold text-xl transition-all"
          >
            🎮 Начать раунд {gameSession.currentRound}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-4">📊 Информация</h3>
          <div className="space-y-2 text-gray-700 dark:text-gray-300">
            <p>Вы создали турнир <strong>{tournament.name}</strong></p>
            <p>Всего раундов: <strong>{tournament.maxRounds}</strong></p>
            <p>Сейчас вы находитесь в раунде <strong>{gameSession.currentRound}</strong></p>
            <p className="text-sm text-gray-500">Нажмите &quot;Начать раунд&quot;, чтобы начать игру!</p>
          </div>
        </div>

        <button
          onClick={handleExit}
          className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-all"
        >
          ← Выйти в меню
        </button>
      </div>
    </div>
  );
}
