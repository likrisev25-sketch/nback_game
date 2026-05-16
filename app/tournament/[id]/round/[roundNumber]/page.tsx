'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { NBackGame } from '@/components/game/NBackGame';

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
  name: string;
  totalCorrectAnswers: number;
  totalErrors: number;
  roundWins: number;
  isBot: boolean;
  botAccuracy?: number;
  lastRoundCorrect?: number;
  lastRoundErrors?: number;
}

export default function TournamentRoundPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roundNumber = params.roundNumber as string;
  const tournamentId = params.id as string;
  const sessionId = searchParams.get('sessionId');
  const playerId = searchParams.get('playerId');

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoundResults, setShowRoundResults] = useState(false);
  const [roundResults, setRoundResults] = useState<any>(null);

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

  const saveRoundResults = async (correctAnswers: number, errors: number) => {
    try {
      console.log('💾 [saveRoundResults] Сохранение результатов:', { correctAnswers, errors });
      // Получаем актуальные данные из sessionStorage
      const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
      if (!stored) {
        console.error('❌ [saveRoundResults] Данные не найдены в sessionStorage');
        return;
      }
      
      const data = JSON.parse(stored);
      console.log('📊 [saveRoundResults] Данные из sessionStorage:', data);
      
      // ЗАГРУЖАЕМ АКТУАЛЬНУЮ СТАТИСТИКУ ВСЕХ ИГРОКОВ С СЕРВЕРА
      console.log('📊 [saveRoundResults] Загрузка актуальной статистики с сервера...');
      const statsResponse = await fetch(`/api/game/${sessionId}/stats`);
      if (!statsResponse.ok) {
        console.error('❌ [saveRoundResults] Не удалось загрузить статистику с сервера');
        return;
      }
      
      const statsData = await statsResponse.json();
      console.log('📊 [saveRoundResults] Статистика с сервера:', statsData);
      
      // Подготавливаем результаты всех игроков используя данные с сервера
      const playerResults = data.players.map((p: TournamentPlayer) => {
        // Ищем статистику этого игрока с сервера
        const serverStats = statsData.players.find((s: any) => s.id === p.id);
        
        // Для текущего игрока используем переданные correctAnswers/errors
        // Для бота и других используем данные с сервера
        const isCurrentUser = p.id === playerId;
        
        let roundCorrect, roundErrors;
        
        if (isCurrentUser) {
          // Для текущего игрока используем переданные значения
          roundCorrect = correctAnswers;
          roundErrors = errors;
        } else if (serverStats) {
          // Для бота используем данные с сервера
          // Но нам нужно вычесть предыдущие total чтобы получить только этот раунд
          roundCorrect = serverStats.correctAnswers;
          roundErrors = serverStats.errors;
        } else {
          // Фолбэк на lastRound из sessionStorage
          roundCorrect = p.lastRoundCorrect || 0;
          roundErrors = p.lastRoundErrors || 0;
        }
        
        console.log(`  Игрок ${p.name || p.id}:`, {
          isCurrentUser,
          serverStats,
          roundCorrect,
          roundErrors,
        });
        
        return {
          playerId: p.id,
          correctAnswers: roundCorrect,
          errors: roundErrors,
          isBot: p.isBot,
          botAccuracy: p.botAccuracy,
        };
      });

      console.log('📤 [saveRoundResults] Отправка на сервер:', {
        sessionId,
        roundNumber: parseInt(roundNumber),
        playerResults,
      });

      // Отправляем результаты на сервер
      const response = await fetch(`/api/tournament/${tournamentId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          roundNumber: parseInt(roundNumber),
          playerResults,
        }),
      });

      if (response.ok) {
        const resultData = await response.json();
        console.log('✅ [saveRoundResults] Результаты сохранены:', resultData);
        setRoundResults(resultData);
      } else {
        const errorData = await response.json();
        console.error('❌ [saveRoundResults] Ошибка сервера:', errorData);
      }
    } catch (error) {
      console.error('❌ [saveRoundResults] Ошибка сохранения результатов:', error);
    }
  };

  const handleRoundComplete = async (correctAnswers: number, errors: number) => {
    console.log('🏆 [TournamentRound] === НАЧАЛО ОБРАБОТКИ РЕЗУЛЬТАТОВ ===');
    console.log('🏆 [TournamentRound] correctAnswers из NBackGame:', correctAnswers);
    console.log('🏆 [TournamentRound] errors из NBackGame:', errors);

    const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
    if (!stored) {
      console.error('❌ [TournamentRound] Данные турнира не найдены!');
      alert('Ошибка: данные турнира потеряны');
      router.push(`/tournament/${tournamentId}`);
      return;
    }

    try {
      const data = JSON.parse(stored);

      // ЗАГРУЖАЕМ АКТУАЛЬНУЮ СТАТИСТИКУ ВСЕХ ИГРОКОВ С СЕРВЕРА
      console.log('📊 [TournamentRound] Загрузка актуальной статистики с сервера...');
      const statsResponse = await fetch(`/api/game/${sessionId}/stats`);
      if (!statsResponse.ok) {
        console.error('❌ [TournamentRound] Не удалось загрузить статистику с сервера');
        // Продолжаем с локальными данными если не удалось загрузить
      }
      
      const statsData = statsResponse.ok ? await statsResponse.json() : null;
      console.log('📊 [TournamentRound] Статистика с сервера:', statsData);

      // Обновляем данные игроков
      const updatedPlayers = data.players.map((p: TournamentPlayer) => {
        const isCurrentUser = p.id === playerId;
        
        // Получаем статистику с сервера для этого игрока
        const serverStats = statsData?.players.find((s: any) => s.id === p.id);
        
        let newTotalCorrect, newTotalErrors, newRoundWins;
        
        if (isCurrentUser) {
          // Для текущего игрока используем переданные correctAnswers/errors
          newTotalCorrect = p.totalCorrectAnswers + correctAnswers;
          newTotalErrors = p.totalErrors + errors;
          newRoundWins = correctAnswers > errors ? p.roundWins + 1 : p.roundWins;
        } else if (serverStats) {
          // Для бота используем данные с сервера
          newTotalCorrect = p.totalCorrectAnswers + serverStats.correctAnswers;
          newTotalErrors = p.totalErrors + serverStats.errors;
          newRoundWins = serverStats.correctAnswers > serverStats.errors ? p.roundWins + 1 : p.roundWins;
        } else {
          // Фолбэк
          newTotalCorrect = p.totalCorrectAnswers;
          newTotalErrors = p.totalErrors;
          newRoundWins = p.roundWins;
        }
        
        console.log(`  Обновляем игрока ${p.name || 'Player'}:`, {
          isCurrentUser,
          serverStats,
          oldTotalCorrect: p.totalCorrectAnswers,
          newTotalCorrect,
          oldTotalErrors: p.totalErrors,
          newTotalErrors,
        });

        return {
          ...p,
          totalCorrectAnswers: newTotalCorrect,
          totalErrors: newTotalErrors,
          roundWins: newRoundWins,
          lastRoundCorrect: isCurrentUser ? correctAnswers : (serverStats?.correctAnswers || p.lastRoundCorrect || 0),
          lastRoundErrors: isCurrentUser ? errors : (serverStats?.errors || p.lastRoundErrors || 0),
        };
      });

      const currentRoundNum = parseInt(roundNumber);
      const newRound = currentRoundNum + 1;
      const isTournamentFinished = newRound > data.tournament.maxRounds;

      const updatedTournament = {
        ...data.tournament,
        currentRound: newRound,
        status: isTournamentFinished ? 'finished' : 'playing',
      };

      // Сохраняем обновленные данные
      const newGameData = {
        tournament: updatedTournament,
        players: updatedPlayers,
        sessionId: data.sessionId,
        playerId: data.playerId,
        currentRound: newRound,
      };

      sessionStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(newGameData));
      console.log('✅ Данные сохранены в sessionStorage:', newGameData);

      // Сохраняем результаты на сервере
      await saveRoundResults(correctAnswers, errors);

      // Обновляем state players чтобы результаты отображались правильно
      setPlayers(updatedPlayers);
      setTournament(updatedTournament);
      
      // Показываем результаты раунда
      setShowRoundResults(true);

    } catch (error) {
      console.error('❌ [TournamentRound] Ошибка обработки результатов:', error);
      alert('Ошибка обработки результатов игры');
      router.push(`/tournament/${tournamentId}`);
    }
  };

  const handleNextRound = () => {
    setShowRoundResults(false);
    const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
    if (!stored) return;
    
    const data = JSON.parse(stored);
    const currentRoundNum = parseInt(roundNumber);
    const newRound = currentRoundNum + 1;
    
    if (newRound > data.tournament.maxRounds) {
      // Турнир завершен
      router.push(`/tournament/${tournamentId}/results`);
    } else {
      // Переходим к следующему раунду
      router.push(`/tournament/${tournamentId}`);
    }
  };

  const handleExit = () => {
    if (confirm('Вы действительно хотите выйти из игры? Прогресс раунда будет потерян.')) {
      router.push(`/tournament/${tournamentId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-white flex items-center justify-center">
        <div className="text-lg text-gray-500">Загрузка раунда...</div>
      </div>
    );
  }

  if (!tournament || !sessionId || !playerId) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-white flex items-center justify-center">
        <div className="text-lg text-gray-500">Ошибка загрузки раунда</div>
      </div>
    );
  }

  // Показываем результаты раунда
  if (showRoundResults) {
    const currentPlayer = players.find(p => p.id === playerId);
    
    console.log('📊 [Results] Показываем результаты:', {
      currentPlayer,
      players,
      lastRoundCorrect: currentPlayer?.lastRoundCorrect,
      lastRoundErrors: currentPlayer?.lastRoundErrors,
    });
    
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f7f4fb] py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="text-2xl font-bold">Раунд {roundNumber} завершён</h2>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                <div className="text-xs text-gray-500 uppercase">Правильно</div>
                <div className="text-3xl font-bold text-green-600">{currentPlayer?.lastRoundCorrect ?? 'N/A'}</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-5">
                <div className="text-xs text-gray-500 uppercase">Ошибки</div>
                <div className="text-3xl font-bold text-red-600">{currentPlayer?.lastRoundErrors ?? 'N/A'}</div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-gray-100 p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Общий счёт</h3>
              <div className="space-y-3">
                {/* Показываем только себя */}
                <div className="flex justify-between items-center rounded-md px-4 py-3 text-sm bg-blue-50 border-2 border-blue-200">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">👤</span>
                    <span className="font-bold text-gray-800">Вы</span>
                  </div>
                  <div className="flex gap-4 text-base">
                    <span className="text-green-600 font-bold">{currentPlayer?.totalCorrectAnswers || 0} ✓</span>
                    <span className="text-red-600 font-bold">{currentPlayer?.totalErrors || 0} ✗</span>
                  </div>
                </div>

                {/* Показываем бота с общим счёт */}
                {players.filter(p => p.isBot).map((player) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center rounded-md px-4 py-3 text-sm bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🤖</span>
                      <span className="font-medium text-gray-700">{player.name || 'Бот'}</span>
                    </div>
                    <div className="flex gap-4 text-base">
                      <span className="text-green-600 font-bold">{player.totalCorrectAnswers} ✓</span>
                      <span className="text-red-600 font-bold">{player.totalErrors} ✗</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleNextRound}
              className="mt-8 h-12 w-full rounded-lg bg-gray-900 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              {parseInt(roundNumber) >= tournament.maxRounds ? 'Завершить турнир' : 'Следующий раунд'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f7f4fb] py-6 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleExit}
            className="h-9 rounded-lg border border-gray-200 px-4 text-sm font-medium hover:bg-gray-50 transition"
          >
            ← Турнир
          </button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{tournament.name}</h2>
            <p className="text-xs text-gray-500">Раунд {roundNumber} / {tournament.maxRounds}</p>
          </div>
          <div className="w-20"></div>
        </div>

        <NBackGame
          sessionId={sessionId}
          playerId={playerId}
          nValue={tournament.nValue}
          onComplete={handleRoundComplete}
        />
      </div>
    </div>
  );
}
