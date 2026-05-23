'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

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
  currentPlayers: number;
  players: Array<{
    name: string;
    isHost: boolean;
  }>;
  createdAt: string;
}

export default function TournamentsPage() {
  const { data: session, isLoading: loadingAuth } = useSession();
  const router = useRouter();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nValue: 2,
    totalSteps: 30,
    baseSpeedMs: 2000,
    maxRounds: 5,
    minPlayers: 2,
    maxPlayers: 4,
    password: '',
  });

  // Загрузка списка турниров
  useEffect(() => {
    if (!loadingAuth && session) {
      fetchTournaments();
      
      // Обновляем список каждые 10 секунд
      const interval = setInterval(fetchTournaments, 10000);
      return () => clearInterval(interval);
    }
  }, [loadingAuth, session]);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournament/list');
      const data = await response.json();
      
      if (data.success) {
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) return;

    try {
      const response = await fetch('/api/tournament/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          nValue: formData.nValue,
          totalSteps: formData.totalSteps,
          baseSpeedMs: formData.baseSpeedMs,
          maxRounds: formData.maxRounds,
          minPlayers: formData.minPlayers,
          maxPlayers: formData.maxPlayers,
          password: formData.password || undefined,
          userId: session.user.id,
          userName: session.user.name || 'Игрок',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        router.push(`/tournament/${data.tournament.id}`);
      } else {
        setError(data.error || 'Не удалось создать турнир');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      setError('Произошла ошибка при создании турнира');
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!session?.user) {
      setError('Необходимо авторизоваться');
      return;
    }

    try {
      const response = await fetch('/api/tournament/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          userId: session.user.id,
          userName: session.user.name || 'Игрок',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push(`/tournament/${tournamentId}`);
      } else {
        setError(data.error || 'Не удалось присоединиться к турниру');
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      setError('Произошла ошибка при присоединении');
    }
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Требуется авторизация
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Пожалуйста, войдите в систему чтобы создавать и присоединяться к турнирам.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            🏆 Турниры
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Создайте турнир или присоединитесь к существующему
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
        >
          + Создать турнир
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка турниров...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Пока нет доступных турниров. Создайте первый!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {tournament.name}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                      🎯 N-{tournament.nValue}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                      ⚡ {tournament.baseSpeedMs}ms
                    </span>
                    <span className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium">
                      🔄 {tournament.maxRounds} раундов
                    </span>
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                      👥 {tournament.currentPlayers}/{tournament.maxPlayers} игроков
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Игроки: {tournament.players.map((p) => 
                      p.isHost ? `${p.name} (Хост)` : p.name
                    ).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => handleJoinTournament(tournament.id)}
                  disabled={tournament.currentPlayers >= tournament.maxPlayers}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold transition-all shadow-lg"
                >
                  {tournament.currentPlayers >= tournament.maxPlayers ? 'Заполнено' : 'Присоединиться'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно создания турнира */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Создать турнир
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название турнира
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Мой турнир"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    N-значение
                  </label>
                  <select
                    value={formData.nValue}
                    onChange={(e) => setFormData({ ...formData, nValue: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>1 (Легко)</option>
                    <option value={2}>2 (Средне)</option>
                    <option value={3}>3 (Сложно)</option>
                    <option value={4}>4 (Очень сложно)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Раундов
                  </label>
                  <select
                    value={formData.maxRounds}
                    onChange={(e) => setFormData({ ...formData, maxRounds: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={3}>3 раунда</option>
                    <option value={5}>5 раундов</option>
                    <option value={10}>10 раундов</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Шагов в раунде
                  </label>
                  <select
                    value={formData.totalSteps}
                    onChange={(e) => setFormData({ ...formData, totalSteps: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={20}>20 шагов</option>
                    <option value={30}>30 шагов</option>
                    <option value={50}>50 шагов</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Скорость (мс)
                  </label>
                  <select
                    value={formData.baseSpeedMs}
                    onChange={(e) => setFormData({ ...formData, baseSpeedMs: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={2500}>2500ms (Легко)</option>
                    <option value={2000}>2000ms (Средне)</option>
                    <option value={1500}>1500ms (Сложно)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Мин. игроков
                  </label>
                  <select
                    value={formData.minPlayers}
                    onChange={(e) => setFormData({ ...formData, minPlayers: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={2}>2 игрока</option>
                    <option value={3}>3 игрока</option>
                    <option value={4}>4 игрока</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Макс. игроков
                  </label>
                  <select
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={2}>2 игрока</option>
                    <option value={3}>3 игрока</option>
                    <option value={4}>4 игрока</option>
                    <option value={5}>5 игроков</option>
                    <option value={6}>6 игроков</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Пароль (опционально)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Придумайте пароль"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50"
              >
                Создать турнир
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
