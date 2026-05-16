'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function TournamentPage() {
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [gameSession, setGameSession] = useState<{ sessionId: string; playerId: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nValue: 2,
    totalSteps: 30,
    baseSpeedMs: 2000,
    maxRounds: 5,
    addBot: false,
    botAccuracy: 80,
  });

  const handleCreateTournament = async () => {
    if (!formData.name.trim()) {
      alert('Введите название турнира!');
      return;
    }

    setLoading(true);
    try {
      console.log('🏆 [handleCreateTournament] Создание турнира...');
      const response = await fetch('/api/tournament/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания турнира');
      }

      const data = await response.json();
      console.log('🏆 [handleCreateTournament] Турнир создан:', data);
      
      // Сохраняем данные турнира в sessionStorage
      sessionStorage.setItem(
        `tournament_${data.tournament.id}`,
        JSON.stringify({
          tournament: data.tournament,
          players: data.players,
          sessionId: data.sessionId,
          playerId: data.playerId,
          currentRound: data.currentRound || 1,
        })
      );
      
      setTournament(data.tournament);
      setPlayers(data.players);
      setGameSession({ sessionId: data.sessionId, playerId: data.playerId });
      setShowCreateForm(false);
    } catch (error: unknown) {
      console.error('❌ [handleCreateTournament] Ошибка:', error);
      alert('Ошибка создания турнира: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (gameSession && tournament) {
      console.log('🏆 [handleJoinGame] Переходим на страницу турнира:', tournament.id);
      console.log('🏆 [handleJoinGame] sessionId:', gameSession.sessionId);
      console.log('🏆 [handleJoinGame] playerId:', gameSession.playerId);
      
      // Проверяем, что данные сохранены
      const stored = sessionStorage.getItem(`tournament_${tournament.id}`);
      console.log('🏆 [handleJoinGame] Данные в sessionStorage:', stored ? 'ЕСТЬ' : 'НЕТ');
      
      router.push(`/tournament/${tournament.id}`);
    } else {
      console.error('❌ [handleJoinGame] gameSession или tournament не определены');
    }
  };

  const handleBack = () => {
    router.push('/');
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Турнирный режим
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Создай турнир и соревнуйся с ботами</p>
          </div>
          
          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Создать новый турнир</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Название турнира</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  placeholder="Мой турнир"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">N-значение</label>
                  <select
                    value={formData.nValue}
                    onChange={(e) => setFormData({ ...formData, nValue: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value={1}>1 (Легко)</option>
                    <option value={2}>2 (Средне)</option>
                    <option value={3}>3 (Сложно)</option>
                    <option value={4}>4 (Очень сложно)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Количество раундов</label>
                  <select
                    value={formData.maxRounds}
                    onChange={(e) => setFormData({ ...formData, maxRounds: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value={3}>3 раунда</option>
                    <option value={5}>5 раундов</option>
                    <option value={10}>10 раундов</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Длительность раунда</label>
                  <select
                    value={formData.totalSteps}
                    onChange={(e) => setFormData({ ...formData, totalSteps: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value={20}>20 шагов</option>
                    <option value={30}>30 шагов</option>
                    <option value={50}>50 шагов</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Базовая скорость</label>
                  <select
                    value={formData.baseSpeedMs}
                    onChange={(e) => setFormData({ ...formData, baseSpeedMs: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-pink-200 dark:border-pink-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
                  >
                    <option value={2500}>2.5 сек (Легко)</option>
                    <option value={2000}>2 сек (Средне)</option>
                    <option value={1500}>1.5 сек (Сложно)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 rounded-xl bg-pink-50/50 dark:bg-pink-900/20">
                <input
                  type="checkbox"
                  checked={formData.addBot}
                  onChange={(e) => setFormData({ ...formData, addBot: e.target.checked })}
                  className="w-5 h-5 accent-pink-500 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Добавить бота</span>
              </div>

              {formData.addBot && (
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Точность бота: <span className="gradient-text font-bold">{formData.botAccuracy}%</span></label>
                  <select
                    value={formData.botAccuracy}
                    onChange={(e) => setFormData({ ...formData, botAccuracy: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={50}>50% (легкий)</option>
                    <option value={70}>70% (средний)</option>
                    <option value={80}>80% (хороший)</option>
                    <option value={90}>90% (про)</option>
                    <option value={100}>100% (мастер)</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleCreateTournament}
                disabled={loading}
                className="w-full px-6 py-4 gradient-btn text-white rounded-xl font-bold text-lg shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Создание...
                  </span>
                ) : (
                  '🏆 Создать турнир'
                )}
              </button>

              <button
                onClick={handleBack}
                className="w-full px-6 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-pink-200 dark:border-pink-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:bg-pink-50 dark:hover:bg-pink-900/20"
              >
                ← Назад
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tournament?.name}</h2>
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-sm font-medium gradient-text">
              Раунд {tournament?.currentRound} / {tournament?.maxRounds}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">N-значение</div>
              <div className="text-3xl font-bold gradient-text">{tournament?.nValue}</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Статус</div>
              <div className="text-3xl font-bold gradient-text capitalize">{tournament?.status}</div>
            </div>
          </div>

          <button
            onClick={handleJoinGame}
            className="w-full px-6 py-4 gradient-btn text-white rounded-xl font-bold text-lg shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] transition-all"
          >
            🎮 Начать игру
          </button>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <span>🏆</span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Таблица лидеров</span>
          </h3>
          <div className="space-y-3">
            {players
              .sort((a, b) => b.totalCorrectAnswers - a.totalCorrectAnswers || b.roundWins - a.roundWins)
              .map((player, index) => (
                <div
                  key={player.id}
                  className={`flex justify-between items-center p-4 rounded-xl transition-all ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 shadow-lg shadow-yellow-500/20'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-2 border-gray-300 dark:border-gray-600'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-2 border-orange-300 dark:border-orange-700'
                      : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </span>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{player.isBot ? `Бот` : `Игрок`}</span>
                      {player.isBot && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">{player.botAccuracy}%</span>}
                    </div>
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-bold">✓ {player.totalCorrectAnswers}</span>
                    <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold">✗ {player.totalErrors}</span>
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold">🏆 {player.roundWins}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={handleBack}
          className="w-full px-6 py-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-pink-200 dark:border-pink-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all hover:bg-pink-50 dark:hover:bg-pink-900/20"
        >
          ← Выйти в меню
        </button>
      </div>
    </div>
  );
}