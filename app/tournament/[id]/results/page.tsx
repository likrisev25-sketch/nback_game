'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  const [loading, setLoading] = useState(true);

  // Загрузка данных при монтировании
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTournament(data.tournament);
        setPlayers(data.players);
      } catch (error) {
        console.error('Ошибка парсинга данных турнира:', error);
      }
    }
    setLoading(false);
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

          {currentUser && (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold mb-2">Ваш результат:</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-white">{currentUser.totalCorrectAnswers}</div>
                  <div className="text-sm">✓ Правильных</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{currentUser.totalErrors}</div>
                  <div className="text-sm">✗ Ошибок</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{currentUser.roundWins}</div>
                  <div className="text-sm">🏆 Раундов</div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">🥇 Победитель турнира</h3>
            <div className="bg-yellow-100 dark:bg-yellow-900 border-4 border-yellow-500 rounded-lg p-6">
              <div className="text-6xl mb-2">
                {winner.id === currentUser?.id ? '🎉' : '👑'}
              </div>
              <div className="text-3xl font-bold mb-2">
                {winner.isBot ? `Бот (${winner.botAccuracy}%)` : 'Вы'}
              </div>
              <div className="text-lg">
                {winner.totalCorrectAnswers} правильных ответов • {winner.roundWins} побед в раундах
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-4">📊 Итоговая таблица лидеров</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex justify-between items-center p-4 rounded-lg ${
                  index === 0
                    ? 'bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-500'
                    : index === 1
                    ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400'
                    : index === 2
                    ? 'bg-orange-100 dark:bg-orange-900 border-2 border-orange-500'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </span>
                  <span className="font-bold text-lg">
                    {player.isBot ? `Бот` : `Вы`}
                    {player.isBot && <span className="text-xs text-gray-500 ml-2">(точность {player.botAccuracy}%)</span>}
                  </span>
                </div>
                <div className="flex space-x-6">
                  <span className="text-green-600 font-bold text-lg">✓ {player.totalCorrectAnswers}</span>
                  <span className="text-red-600 font-bold text-lg">✗ {player.totalErrors}</span>
                  <span className="text-blue-600 font-bold text-lg">🏆 {player.roundWins}</span>
                </div>
              </div>
            ))}
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
