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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">🏆 Турнирный режим</h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Создать новый турнир</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название турнира</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Мой турнир"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">N-значение</label>
                  <select
                    value={formData.nValue}
                    onChange={(e) => setFormData({ ...formData, nValue: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={1}>1 (Легко)</option>
                    <option value={2}>2 (Средне)</option>
                    <option value={3}>3 (Сложно)</option>
                    <option value={4}>4 (Очень сложно)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Количество раундов</label>
                  <select
                    value={formData.maxRounds}
                    onChange={(e) => setFormData({ ...formData, maxRounds: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={3}>3 раунда</option>
                    <option value={5}>5 раундов</option>
                    <option value={10}>10 раундов</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Длительность раунда</label>
                  <select
                    value={formData.totalSteps}
                    onChange={(e) => setFormData({ ...formData, totalSteps: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={20}>20 шагов</option>
                    <option value={30}>30 шагов</option>
                    <option value={50}>50 шагов</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Базовая скорость</label>
                  <select
                    value={formData.baseSpeedMs}
                    onChange={(e) => setFormData({ ...formData, baseSpeedMs: Number(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={2500}>2.5 сек (Легко)</option>
                    <option value={2000}>2 сек (Средне)</option>
                    <option value={1500}>1.5 сек (Сложно)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.addBot}
                    onChange={(e) => setFormData({ ...formData, addBot: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Добавить бота</span>
                </label>

                {formData.addBot && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Точность бота</label>
                    <select
                      value={formData.botAccuracy}
                      onChange={(e) => setFormData({ ...formData, botAccuracy: Number(e.target.value) })}
                      className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value={50}>50%</option>
                      <option value={70}>70%</option>
                      <option value={80}>80%</option>
                      <option value={90}>90%</option>
                      <option value={100}>100%</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateTournament}
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Создание...' : '🏆 Создать турнир'}
              </button>

              <button
                onClick={handleBack}
                className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-all"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{tournament?.name}</h2>
            <div className="text-sm text-gray-400">
              Раунд {tournament?.currentRound} / {tournament?.maxRounds}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">N-значение</div>
              <div className="text-2xl font-bold">{tournament?.nValue}</div>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Статус</div>
              <div className="text-2xl font-bold capitalize">{tournament?.status}</div>
            </div>
          </div>

          <button
            onClick={handleJoinGame}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-lg font-bold text-lg transition-all"
          >
            🎮 Начать игру
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-bold mb-4">📊 Таблица лидеров</h3>
          <div className="space-y-2">
            {players
              .sort((a, b) => b.totalCorrectAnswers - a.totalCorrectAnswers || b.roundWins - a.roundWins)
              .map((player, index) => (
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
                    <span className="font-bold">{player.isBot ? `Бот` : `Игрок`}</span>
                    {player.isBot && <span className="text-xs text-gray-500">(точность {player.botAccuracy}%)</span>}
                  </div>
                  <div className="flex space-x-6 text-sm">
                    <span className="text-green-600 font-bold">✓ {player.totalCorrectAnswers}</span>
                    <span className="text-red-600 font-bold">✗ {player.totalErrors}</span>
                    <span className="text-blue-600 font-bold">🏆 {player.roundWins}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={handleBack}
          className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-bold transition-all"
        >
          ← Выйти в меню
        </button>
      </div>
    </div>
  );
}