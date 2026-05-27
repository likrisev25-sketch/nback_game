'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { NBackGame } from '@/components/game/NBackGame';

interface Tournament {
  id: string;
  name: string;
  nValue: number;
  maxRounds: number;
  currentRound: number;
  status: 'waiting' | 'playing' | 'finished';
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
  const [loading, setLoading] = useState(true);

  // Загрузка данных при монтировании
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTournament(data.tournament);
      } catch (error) {
        console.error('Ошибка парсинга данных турнира:', error);
      }
    }
    setLoading(false);
  }, [tournamentId]);

  const handleRoundComplete = (correctAnswers: number, errors: number) => {
    console.log('🏆 [TournamentRound] === НАЧАЛО ОБРАБОТКИ РЕЗУЛЬТАТОВ ===');
    console.log('🏆 [TournamentRound] correctAnswers из NBackGame:', correctAnswers);
    console.log('🏆 [TournamentRound] errors из NBackGame:', errors);
    console.log('🏆 [TournamentRound] playerId:', playerId);
    console.log('🏆 [TournamentRound] roundNumber:', roundNumber);
    console.log('🏆 [TournamentRound] tournamentId:', tournamentId);

    const stored = sessionStorage.getItem(`tournament_${tournamentId}`);
    if (!stored) {
      console.error('❌ [TournamentRound] Данные турнира не найдены в sessionStorage!');
      console.error('❌ [TournamentRound] tournamentId:', tournamentId);
      alert('Ошибка: данные турнира потеряны');
      router.push(`/tournament/${tournamentId}`);
      return;
    }

    try {
      const data = JSON.parse(stored);
      console.log('🏆 [TournamentRound] Данные из sessionStorage:', JSON.stringify(data, null, 2));

      // Находим игрока и обновляем его счет
      const updatedPlayers = data.players.map((p: { id: string; totalCorrectAnswers: number; totalErrors: number; roundWins: number; isBot: boolean; botAccuracy: number }) => {
        const isCurrentUser = p.id === playerId;
        console.log('🏆 [TournamentRound] Обрабатываем игрока:', {
          id: p.id,
          isCurrentUser,
          oldTotalCorrectAnswers: p.totalCorrectAnswers,
          oldTotalErrors: p.totalErrors,
          oldRoundWins: p.roundWins,
        });
        
        const newTotalCorrect = isCurrentUser ? p.totalCorrectAnswers + correctAnswers : p.totalCorrectAnswers;
        const newTotalErrors = isCurrentUser ? p.totalErrors + errors : p.totalErrors;
        const newRoundWins = isCurrentUser && correctAnswers > errors ? p.roundWins + 1 : p.roundWins;

        console.log('🏆 [TournamentRound] Новые значения:', {
          newTotalCorrect,
          newTotalErrors,
          newRoundWins,
        });
        
        return {
          ...p,
          totalCorrectAnswers: newTotalCorrect,
          totalErrors: newTotalErrors,
          roundWins: newRoundWins,
        };
      });

      console.log('🏆 [TournamentRound] Обновленные игроки:', JSON.stringify(updatedPlayers, null, 2));

      const currentRoundNum = parseInt(roundNumber);
      const newRound = currentRoundNum + 1;
      const updatedTournament = {
        ...data.tournament,
        currentRound: newRound,
        status: newRound > data.tournament.maxRounds ? 'finished' : 'playing',
      };

      console.log('🏆 [TournamentRound] Текущий раунд:', currentRoundNum);
      console.log('🏆 [TournamentRound] Новый раунд:', newRound);
      console.log('🏆 [TournamentRound] Максимум раундов:', data.tournament.maxRounds);

      const newGameData = {
        tournament: updatedTournament,
        players: updatedPlayers,
        sessionId: data.sessionId,
        playerId: data.playerId,
        currentRound: newRound,
      };

      console.log('🏆 [TournamentRound] Сохраняем в sessionStorage:', JSON.stringify(newGameData, null, 2));
      sessionStorage.setItem(
        `tournament_${tournamentId}`,
        JSON.stringify(newGameData)
      );

      if (newRound > data.tournament.maxRounds) {
        console.log('🏆 [TournamentRound] Турнир завершен! Переходим к результатам...');
        router.push(`/tournament/${tournamentId}/results`);
      } else {
        console.log('🏆 [TournamentRound] Идем к следующему раунду...');
        router.push(`/tournament/${tournamentId}`);
      }
    } catch (error) {
      console.error('❌ [TournamentRound] Ошибка обработки результатов:', error);
      alert('Ошибка обработки результатов игры: ' + (error as Error).message);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-2xl">Загрузка раунда...</div>
      </div>
    );
  }

  if (!tournament || !sessionId || !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-2xl">Ошибка загрузки раунда</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium"
          >
            ← Выйти в турнир
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{tournament.name}</h2>
            <p className="text-sm">Раунд {roundNumber} / {tournament.maxRounds}</p>
          </div>
          <div className="w-24"></div>
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
