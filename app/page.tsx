'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { NBackGame } from '@/components/game/NBackGame';
import { GameLobby } from '@/components/game/GameLobby';
import { useSession } from '@/lib/auth-client';
import { LandingAuth } from '@/components/auth/LandingAuth';

/**
 * Главная страница
 * Неавторизованные → LandingAuth (регистрация/вход)
 * Авторизованные → Игровое меню
 */
export default function Home() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading, mutate: refetchSession } = useSession();

  const isMounted = useRef(true);
  const joiningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [currentScreen, setCurrentScreen] = useState<'menu' | 'lobby' | 'game'>('menu');

  // Данные для создания игры
  const [newGameName, setNewGameName] = useState('');
  const [nValue, setNValue] = useState(3);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [addBot, setAddBot] = useState(false);
  const [botAccuracy, setBotAccuracy] = useState(80);

  // Данные для присоединения
  const [joinGameId, setJoinGameId] = useState('');

  const [gameError, setGameError] = useState<string | null>(null);

  // Данные текущей игры
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  // Список активных игр
  const [activeGames, setActiveGames] = useState<Array<{
    id: string;
    name: string;
    nValue: number;
    playerCount: number;
    maxPlayers: number;
    canJoin: boolean;
    createdAt: string;
  }>>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  const playerName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Игрок';

  // Очистка при размонтировании
  useEffect(() => {
    isMounted.current = true;
    
    // Polling для проверки сессии каждые 2 секунды (если сессия ещё не загружена)
    if (!sessionLoading && !session?.user) {
      sessionIntervalRef.current = setInterval(async () => {
        if (!isMounted.current) return;
        console.log('🔵 [session polling] Checking session...');
        await refetchSession();
      }, 2000);
    }
    
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [sessionLoading, session?.user, refetchSession]);

  // Загрузка списка активных игр
  const loadActiveGames = useCallback(async () => {
    if (!isMounted.current) return;
    setLoadingGames(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/game/list', {
        signal: abortControllerRef.current.signal,
      });
      if (!isMounted.current) return;
      if (response.ok) {
        const data = await response.json();
        setActiveGames(data.games || []);
      } else {
        setActiveGames([]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (isMounted.current) setActiveGames([]);
    } finally {
      if (isMounted.current) setLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'menu') {
      loadActiveGames();
      intervalRef.current = setInterval(() => {
        if (currentScreen === 'menu' && isMounted.current) loadActiveGames();
      }, 10000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [currentScreen, loadActiveGames]);

  // Присоединение к существующей сессии
  const joinSession = useCallback(async (sessionId: string) => {
    if (joiningRef.current) return;

    joiningRef.current = true;
    setGameError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          playerName,
          userId: session?.user?.id,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!isMounted.current) { joiningRef.current = false; return; }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Join error response:', errorText);
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Join success:', data);
      
      if (!data.playerId) {
        throw new Error('Сервер не вернул playerId');
      }

      setCurrentSessionId(data.playerId ? sessionId : null);
      setCurrentPlayerId(data.playerId);
      setCurrentScreen('lobby');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (isMounted.current) {
        setGameError(error instanceof Error ? error.message : 'Неизвестная ошибка');
        alert('Ошибка присоединения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      }
    } finally {
      if (isMounted.current) joiningRef.current = false;
    }
  }, [playerName, session]);

  // Создание новой сессии
  const createSession = useCallback(async (gameData: {
    name: string;
    nValue: number;
    maxPlayers: number;
    addBot: boolean;
    botAccuracy: number;
  }) => {
    if (joiningRef.current) return;

    joiningRef.current = true;
    setGameError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameData.name,
          nValue: gameData.nValue,
          totalSteps: 30,
          baseSpeedMs: 2000,
          maxPlayers: gameData.maxPlayers,
          addBot: gameData.addBot,
          botAccuracy: gameData.botAccuracy,
          userId: session?.user?.id,
          playerName,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!isMounted.current) { joiningRef.current = false; return; }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      if (!data.sessionId || !data.playerId) {
        throw new Error('Сервер не вернул необходимые данные');
      }

      setCurrentSessionId(data.sessionId);
      setCurrentPlayerId(data.playerId);
      setCurrentScreen('lobby');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (isMounted.current) {
        setGameError(error instanceof Error ? error.message : 'Неизвестная ошибка');
        alert('Ошибка создания игры: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      }
    } finally {
      if (isMounted.current) joiningRef.current = false;
    }
  }, [playerName, session]);

  const handleCreateGame = useCallback(() => {
    if (!newGameName.trim()) {
      alert('Введите название игры');
      return;
    }
    createSession({
      name: newGameName.trim(),
      nValue,
      maxPlayers,
      addBot,
      botAccuracy,
    });
  }, [newGameName, nValue, maxPlayers, addBot, botAccuracy, createSession]);

  const handleJoinGame = useCallback(() => {
    const id = joinGameId.trim();
    if (!id) {
      alert('Введите ID игры');
      return;
    }
    if (!/^\d{6}$/.test(id)) {
      alert('ID игры должен состоять из 6 цифр');
      return;
    }
    joinSession(id);
  }, [joinGameId, joinSession]);

  const handleJoinGameFromList = useCallback((gameId: string) => {
    console.log('🔵 [handleJoinGameFromList] Попытка присоединиться к игре:', gameId);
    joinSession(gameId);
  }, [joinSession]);

  const handleGameComplete = useCallback((correctAnswers: number, errors: number) => {
    if (!isMounted.current) return;

    fetch('/api/game/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: currentSessionId,
        playerId: currentPlayerId,
        correctAnswers,
        errors,
      }),
    }).catch(console.error);

    setCurrentScreen('menu');
    setCurrentSessionId(null);
    setCurrentPlayerId(null);
    setGameError(null);
  }, [currentSessionId, currentPlayerId]);

  const handleGameError = useCallback((error: string) => {
    if (isMounted.current) {
      setGameError(error);
      setCurrentScreen('menu');
      setCurrentSessionId(null);
      setCurrentPlayerId(null);
    }
  }, []);

  const handleExitGame = useCallback(() => {
    const confirmed = window.confirm(
      'Вы действительно хотите выйти из игры? Ваш прогресс будет потерян.'
    );
    
    if (confirmed) {
      // Отправляем завершение игры на сервер
      if (currentSessionId && currentPlayerId) {
        fetch('/api/game/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: currentSessionId,
            playerId: currentPlayerId,
            correctAnswers: 0,
            errors: 0,
          }),
        }).catch(console.error);
      }
      
      setCurrentScreen('menu');
      setCurrentSessionId(null);
      setCurrentPlayerId(null);
      setGameError(null);
    }
  }, [currentSessionId, currentPlayerId]);

  const handleLobbyStart = useCallback(() => {
    setCurrentScreen('game');
  }, []);

  const handleLobbyExit = useCallback(() => {
    if (currentSessionId && currentPlayerId) {
      fetch('/api/game/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          playerId: currentPlayerId,
          correctAnswers: 0,
          errors: 0,
        }),
      }).catch(console.error);
    }

    setCurrentScreen('menu');
    setCurrentSessionId(null);
    setCurrentPlayerId(null);
    setGameError(null);
  }, [currentSessionId, currentPlayerId]);

  const copyGameId = useCallback((id: string) => {
    navigator.clipboard.writeText(id)
      .then(() => alert('ID игры скопирован'))
      .catch(() => alert('Не удалось скопировать ID'));
  }, []);

  // ====== РЕНДЕР ======

  // 1. Загрузка
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. Неавторизован → LandingAuth
  if (!session?.user) {
    return <LandingAuth />;
  }

  // 3. Авторизован → Игра
  return (
    <div className="w-full">
      {gameError && currentScreen === 'menu' && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
            <strong>Ошибка: </strong>
            <span className="block sm:inline">{gameError}</span>
            <button onClick={() => setGameError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>
      )}

      {currentScreen === 'menu' && (
        <>
          {/* Hero */}
          <section className="text-center py-16 px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Тренируй свой мозг
            </h1>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-blue-600 dark:text-blue-400">
              NBACK GAME
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Развивай рабочую память и концентрацию. Принимай вызов. Стань лучше каждый день.
            </p>

            <div className="mb-8">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Игрок: <strong className="text-blue-600 dark:text-blue-400">{playerName}</strong>
              </p>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => document.getElementById('play')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800 text-white rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Начать тренировку
              </button>
              <button
                onClick={() => router.push('/tournament')}
                className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-lg font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md"
              >
                🏆 Турниры
              </button>
            </div>
          </section>

          {/* Game section */}
          <section id="play" className="py-16 px-4 bg-white dark:bg-gray-800">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Начни тренировку</h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Создание игры */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
                  <h4 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Создать игру</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Название игры</label>
                      <input
                        type="text"
                        value={newGameName}
                        onChange={(e) => setNewGameName(e.target.value.slice(0, 50))}
                        placeholder="Моя игра"
                        maxLength={50}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        N-значение: <strong className="text-blue-600 dark:text-blue-400">{nValue}</strong>
                      </label>
                      <select
                        value={nValue}
                        onChange={(e) => setNValue(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value={2}>N=2 (легко)</option>
                        <option value={3}>N=3 (средне)</option>
                        <option value={4}>N=4 (сложно)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Игроки: <strong className="text-green-600 dark:text-green-400">{maxPlayers}</strong>
                      </label>
                      <input
                        type="range" min="2" max="4"
                        value={maxPlayers}
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>2</span><span>3</span><span>4</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox" id="addBot"
                        checked={addBot}
                        onChange={(e) => setAddBot(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="addBot" className="text-sm font-medium text-gray-700 dark:text-gray-300">Добавить бота</label>
                    </div>

                    {addBot && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Точность бота: {botAccuracy}%</label>
                        <select
                          value={botAccuracy}
                          onChange={(e) => setBotAccuracy(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value={50}>50% (новичок)</option>
                          <option value={70}>70% (любитель)</option>
                          <option value={80}>80% (профи)</option>
                          <option value={90}>90% (эксперт)</option>
                          <option value={100}>100% (идеал)</option>
                        </select>
                      </div>
                    )}

                    <button
                      onClick={handleCreateGame}
                      disabled={joiningRef.current}
                      className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                      {joiningRef.current ? 'Создание...' : 'Создать игру'}
                    </button>

                    {currentSessionId && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-800 dark:text-green-200 font-bold mb-2">✅ Игра создана!</p>
                        <code className="block bg-white dark:bg-gray-800 px-3 py-2 rounded text-xs break-all font-mono mb-2 border border-gray-200 dark:border-gray-600">
                          {currentSessionId}
                        </code>
                        <button onClick={() => copyGameId(currentSessionId)} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors">
                          📋 Копировать ID
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Присоединение */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-lg">
                  <h4 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Присоединиться</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ID игры</label>
                      <input
                        type="text"
                        value={joinGameId}
                        onChange={(e) => setJoinGameId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        maxLength={6}
                        inputMode="numeric"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-widest font-mono text-center text-lg"
                      />
                    </div>

                    <button
                      onClick={handleJoinGame}
                      disabled={joiningRef.current}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                      {joiningRef.current ? 'Присоединение...' : 'Присоединиться'}
                    </button>

                    {/* Список активных игр */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">Активные игры</h5>
                        <button
                          onClick={loadActiveGames}
                          disabled={loadingGames}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50 transition-colors"
                        >
                          {loadingGames ? '⟳ Обновление...' : '↻ Обновить'}
                        </button>
                      </div>

                      {loadingGames ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <p className="text-sm text-gray-500 mt-2">Загрузка...</p>
                        </div>
                      ) : activeGames.length === 0 ? (
                        <div className="text-center py-8 bg-gray-100 dark:bg-gray-600 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-300">Нет активных игр</p>
                          <p className="text-xs text-gray-400 mt-1">Создайте новую игру, чтобы начать</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {activeGames.map((game) => (
                            <div
                              key={game.id}
                              className={`p-3 rounded-lg border transition-all ${
                                game.canJoin
                                  ? 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer hover:shadow-md'
                                  : 'opacity-60 bg-gray-100 dark:bg-gray-800'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900 dark:text-white">{game.name}</p>
                                  <div className="flex gap-3 mt-1">
                                    <p className="text-xs text-gray-500">🎯 N={game.nValue}</p>
                                    <p className="text-xs text-gray-500">👥 {game.playerCount}/{game.maxPlayers}</p>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">🕐 {new Date(game.createdAt).toLocaleTimeString()}</p>
                                </div>
                                <button
                                  onClick={() => handleJoinGameFromList(game.id)}
                                  disabled={!game.canJoin || joiningRef.current}
                                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                                    game.canJoin && !joiningRef.current
                                      ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                                      : 'bg-gray-400 text-white cursor-not-allowed'
                                  }`}
                                >
                                  {game.canJoin ? 'Войти' : 'Полно'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
              {[
                { icon: '🧠', title: 'Улучшай память', desc: 'Развивай рабочую память и концентрацию' },
                { icon: '🎯', title: 'Повышай фокус', desc: 'Тренируй внимание и скорость мышления' },
                { icon: '📈', title: 'Отслеживай прогресс', desc: 'Соревнуйся с собой и достигай высот' },
                { icon: '🏆', title: 'Стань лучшим', desc: 'Брось вызов друзьям и мировым лидерам' },
              ].map((item) => (
                <div key={item.title} className="text-center group">
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How to play */}
          <section className="py-16 px-4 bg-white dark:bg-gray-800">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Как играть?</h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                {[
                  'Вам будут показаны позиции в сетке 3×3.',
                  'Выберите уровень сложности (N-значение) перед началом игры.',
                  'Нажимайте кнопку «СОВПАДЕНИЕ!», когда позиция совпадает с позицией N шагов назад.',
                  'За каждый правильный ответ вы получаете очко.',
                  'За ошибку вы получаете штраф.',
                  'Каждые 3 ошибки увеличивают скорость для всех!',
                  'Побеждает игрок с наибольшим количеством правильных ответов.',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 text-white rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 3 ? 'bg-green-600' : i === 4 ? 'bg-red-600' : i === 5 ? 'bg-yellow-600' : i === 6 ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      {i + 1}
                    </span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="py-8 text-center text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <p>NBACK GAME © 2024</p>
          </footer>
        </>
      )}

      {/* Лобби ожидания */}
      {currentScreen === 'lobby' && currentSessionId && currentPlayerId && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <GameLobby
            sessionId={currentSessionId}
            playerId={currentPlayerId}
            onStart={handleLobbyStart}
            onExit={handleLobbyExit}
          />
        </div>
      )}

      {/* Игра */}
      {currentScreen === 'game' && currentSessionId && currentPlayerId && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Нажмите «Выйти» в игре для завершения
            </p>
            <div className="text-gray-700 dark:text-gray-300">
              Игрок: <strong className="text-blue-600 dark:text-blue-400">{playerName}</strong>
            </div>
          </div>

          <div key={`game-${currentSessionId}`}>
            <NBackGame
              sessionId={currentSessionId}
              playerId={currentPlayerId}
              nValue={nValue}
              onComplete={handleGameComplete}
              onError={(error: Error) => {
                setGameError(`Ошибка игры: ${error.message}`);
                setCurrentScreen('menu');
                setCurrentSessionId(null);
                setCurrentPlayerId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
