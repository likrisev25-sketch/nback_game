'use client';

import { useState, useEffect } from 'react';
import { useLobby } from '@/contexts/LobbyContext';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

interface Lobby {
  id: string;
  name: string;
  currentPlayers: number;
  maxPlayers: number;
  nValue: number;
  baseSpeedMs: number;
  players: Array<{
    name: string;
    isHost: boolean;
  }>;
  createdAt: string;
}

export const LobbyList: React.FC = () => {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStartChoiceModal, setShowStartChoiceModal] = useState(false);
  const [pendingLobbyId, setPendingLobbyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session } = useSession();
  const { joinLobby, toggleAutoStart } = useLobby();
  const router = useRouter();

  // Формы создания лобби
  const [formData, setFormData] = useState({
    name: '',
    minPlayers: 2,
    maxPlayers: 2,
    nValue: 1,
    baseSpeedMs: 2000,
    password: '',
    addBot: false,
    botAccuracy: 80,
    botName: 'Бот',
  });

  // Загрузка списка лобби
  useEffect(() => {
    fetchLobbies();
    
    // Обновляем список каждые 10 секунд
    const interval = setInterval(fetchLobbies, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLobbies = async () => {
    try {
      const response = await fetch('/api/lobby/list');
      const data = await response.json();
      
      if (data.success) {
        setLobbies(data.lobbies);
      }
    } catch (error) {
      console.error('Error fetching lobbies:', error);
      setError('Не удалось загрузить список лобби');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLobby = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 [LobbyList] handleCreateLobby вызван');
    console.log('🔵 [LobbyList] session:', session);
    
    if (!session?.user) {
      console.error('❌ [LobbyList] Нет сессии или пользователя');
      setError('Необходимо авторизоваться');
      return;
    }

    try {
      console.log('🔵 [LobbyList] Создание лобби для пользователя:', session.user.id, session.user.name);
      
      const response = await fetch('/api/lobby/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'default',
          name: formData.name || undefined,
          minPlayers: formData.minPlayers,
          maxPlayers: formData.maxPlayers,
          nValue: formData.nValue,
          baseSpeedMs: formData.baseSpeedMs,
          password: formData.password || undefined,
          userName: session.user.name || 'Игрок',
          addBot: formData.addBot,
          botAccuracy: formData.botAccuracy,
          botName: formData.botName,
        }),
      });

      console.log('🔵 [LobbyList] Response status:', response.status);
      const data = await response.json();
      console.log('📥 [LobbyList] Ответ от сервера:', data);
      
      if (data.success) {
        // Сохраняем lobbyId для модального окна выбора
        setPendingLobbyId(data.lobby.id);
        // Присоединяемся к лобби через WebSocket
        joinLobby(data.lobby.id, session.user.id, session.user.name);
        // Показываем модальное окно выбора
        setShowCreateModal(false);
        setShowStartChoiceModal(true);
      } else {
        console.error('❌ [LobbyList] Ошибка создания лобби:', data.error);
        setError(data.error || 'Не удалось создать лобби');
      }
    } catch (error) {
      console.error('❌ [LobbyList] Исключение при создании лобби:', error);
      setError('Произошла ошибка при создании лобби');
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    if (!session?.user) {
      setError('Необходимо авторизоваться');
      return;
    }

    try {
      const response = await fetch(`/api/lobby/${lobbyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (data.success) {
        // Присоединяемся к лобби через WebSocket
        joinLobby(lobbyId, session.user.id, session.user.name);
        router.push(`/lobby/${lobbyId}`);
      } else {
        setError(data.error || 'Не удалось присоединиться к лобби');
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
      setError('Произошла ошибка при присоединении');
    }
  };

  const handleStartImmediately = () => {
    // Начинаем игру сразу без автозапуска
    if (pendingLobbyId) {
      router.push(`/lobby/${pendingLobbyId}`);
      setShowStartChoiceModal(false);
      setPendingLobbyId(null);
    }
  };

  const handleEnableAutoStart = () => {
    // Включаем автозапуск и переходим в лобби
    if (pendingLobbyId) {
      toggleAutoStart(pendingLobbyId);
      router.push(`/lobby/${pendingLobbyId}`);
      setShowStartChoiceModal(false);
      setPendingLobbyId(null);
    }
  };

  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Требуется авторизация
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Пожалуйста, войдите в систему чтобы создавать и присоединяться к лобби.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Лобби игр
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          + Создать лобби
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка лобби...</p>
        </div>
      ) : lobbies.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Пока нет активных лобби. Создайте первое!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {lobbies.map((lobby) => (
            <div
              key={lobby.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                    {lobby.name}
                  </h3>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>👥 {lobby.currentPlayers}/{lobby.maxPlayers} игроков</span>
                    <span>🎯 N-{lobby.nValue}</span>
                    <span>⚡ {lobby.baseSpeedMs}ms</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Игроки: {lobby.players.map((p) => 
                      p.isHost ? `${p.name} (Хост)` : p.name
                    ).join(', ')}
                  </div>
                </div>
                <button
                  onClick={() => handleJoinLobby(lobby.id)}
                  disabled={lobby.currentPlayers >= lobby.maxPlayers}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {lobby.currentPlayers >= lobby.maxPlayers ? 'Заполнено' : 'Присоединиться'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно создания лобби */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Создать лобби
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <form onSubmit={handleCreateLobby} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Мое лобби"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Минимум игроков для запуска
                </label>
                <select
                  value={formData.minPlayers}
                  onChange={(e) => setFormData({ ...formData, minPlayers: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2}>2 игрока</option>
                  <option value={3}>3 игрока</option>
                  <option value={4}>4 игрока</option>
                  <option value={5}>5 игроков</option>
                  <option value={6}>6 игроков</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Максимум игроков
                </label>
                <select
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                  <option value={6}>6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  N-back значение
                </label>
                <select
                  value={formData.nValue}
                  onChange={(e) => setFormData({ ...formData, nValue: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1-back (Легко)</option>
                  <option value={2}>2-back (Средне)</option>
                  <option value={3}>3-back (Сложно)</option>
                  <option value={4}>4-back (Очень сложно)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Скорость (мс)
                </label>
                <select
                  value={formData.baseSpeedMs}
                  onChange={(e) => setFormData({ ...formData, baseSpeedMs: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3000}>3000ms (Медленно)</option>
                  <option value={2000}>2000ms (Нормально)</option>
                  <option value={1500}>1500ms (Быстро)</option>
                  <option value={1000}>1000ms (Очень быстро)</option>
                </select>
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
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Настройки бота */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="addBot"
                    checked={formData.addBot}
                    onChange={(e) => setFormData({ ...formData, addBot: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="addBot" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Добавить бота
                  </label>
                </div>

                {formData.addBot && (
                  <div className="space-y-3 ml-7">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Название бота
                      </label>
                      <input
                        type="text"
                        value={formData.botName}
                        onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                        placeholder="Бот"
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Точность бота: {formData.botAccuracy}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={formData.botAccuracy}
                        onChange={(e) => setFormData({ ...formData, botAccuracy: Number(e.target.value) })}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Создать
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно выбора стратегии запуска */}
      {showStartChoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Лобби создано! 🎉
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Выберите стратегию запуска игры
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleStartImmediately}
                className="w-full p-4 border-2 border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    🚀
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                      Начать игру сразу
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Перейти в лобби и начать игру вручную
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleEnableAutoStart}
                className="w-full p-4 border-2 border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg">
                      Включить автозапуск
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Игра начнётся автоматически когда все игроки нажмут «Готов»
                    </p>
                  </div>
                </div>
              </button>

              <div className="mt-6 text-center border-t pt-4">
                <button
                  onClick={() => {
                    setShowStartChoiceModal(false);
                    if (pendingLobbyId) {
                      router.push(`/lobby/${pendingLobbyId}`);
                    }
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                >
                  Перейти в лобби без настроек
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
