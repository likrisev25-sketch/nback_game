'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TournamentResult {
  id: string;
  tournamentId: string;
  playerId: string;
  isBot: boolean;
  botAccuracy: number | null;
  totalCorrect: number;
  totalErrors: number;
  roundWins: number;
  rank: number | null;
  createdAt: string;
}

interface TournamentPlayer {
  id: string;
  name?: string;
  tournamentId: string;
  userId: string;
  totalCorrectAnswers: number;
  totalErrors: number;
  roundWins: number;
  isBot: boolean;
  botAccuracy?: number;
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
  createdAt: string;
}

export default function TournamentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [serverResults, setServerResults] = useState<TournamentResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем данные из sessionStorage
        const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
        if (stored) {
          const data = JSON.parse(stored);
          setTournament(data.tournament);
          setPlayers(data.players);
        }

        // Загружаем результаты с сервера
        const response = await fetch(`/api/tournament/${tournamentId}/results`);
        if (response.ok) {
          const data = await response.json();
          setServerResults(data.results || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tournamentId]);

  const handleBackToMenu = () => {
    sessionStorage.removeItem(`tournament_${tournamentId}`);
    router.push('/');
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem(`tournament_${tournamentId}`);
    router.push('/tournament');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-2xl">Загрузка результатов...</div>
      </div>
    );
  }

  if (!tournament || players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-2xl">Турнир не найден</div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort(
    (a, b) => b.totalCorrectAnswers - a.totalCorrectAnswers || b.roundWins - a.roundWins
  );

  const winner = sortedPlayers[0];
  const currentUser = players.find((p) => !p.isBot);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl text-center">
          <h1 className="text-4xl font-bold mb-4">🏆 Турнир завершен!</h1>
          <h2 className="text-2xl mb-6">{tournament.name}</h2>

          {/* Победитель */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">🥇 Победитель турнира</h3>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-8">
              <div className="text-7xl mb-3">
                {winner.id === currentUser?.id ? '🎉' : '👑'}
              </div>
              <div className="text-4xl font-bold mb-3 text-white">
                {winner.isBot ? (winner.name || `Бот ${winner.botAccuracy}%`) : 'Вы'}
              </div>
              <div className="text-xl text-white/90">
                {winner.totalCorrectAnswers} правильных ответов
              </div>
              {winner.id !== currentUser?.id && (
                <div className="mt-4 text-lg text-white/80">
                  Поздравляем победителя! 🎊
                </div>
              )}
            </div>
          </div>

          {/* Ваш результат */}
          {currentUser && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Ваш результат:</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-4xl font-bold text-green-600">{currentUser.totalCorrectAnswers}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">✓ Правильных</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="text-4xl font-bold text-red-600">{currentUser.totalErrors}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">✗ Ошибок</div>
                </div>
              </div>
              
              {/* Сравнение с победителем */}
              {currentUser.id !== winner.id && (
                <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Разница с победителем:
                  </div>
                  <div className="text-2xl font-bold text-red-600 mt-1">
                    -{winner.totalCorrectAnswers - currentUser.totalCorrectAnswers} очков
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Место в турнире */}
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 mb-8">
            <div className="text-lg">
              Ваше место: <span className="font-bold text-xl">#{sortedPlayers.findIndex(p => p.id === currentUser?.id) + 1} из {players.length}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePlayAgain}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg font-bold text-lg transition-all"
          >
            🎮 Сыграть снова
          </button>
          <button
            onClick={handleBackToMenu}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold text-lg transition-all"
          >
            ← В главное меню
          </button>
        </div>
      </div>
    </div>
  );
}
