import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tournamentResults, gamePlayers, gameMoves } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface SaveTournamentResultRequest {
  sessionId: string;
  roundNumber: number;
  playerResults: Array<{
    playerId: string;
    correctAnswers: number;
    errors: number;
    isBot: boolean;
    botAccuracy?: number;
  }>;
}

// Валидация UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Получить результаты турнира
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const tournamentIdStr = String(tournamentId);
    
    if (!tournamentIdStr || !isValidUUID(tournamentIdStr)) {
      return NextResponse.json(
        { error: 'Некорректный ID турнира' },
        { status: 400 }
      );
    }

    // Получаем все результаты турнира
    const results = await db.query.tournamentResults.findMany({
      where: eq(tournamentResults.tournamentId, tournamentIdStr),
      orderBy: (results, { desc }) => [desc(results.totalCorrect)],
    });

    return NextResponse.json({
      success: true,
      tournamentId: tournamentIdStr,
      results: results.map((r, index) => ({
        ...r,
        rank: index + 1,
      })),
    });
  } catch (error) {
    console.error('❌ Ошибка получения результатов турнира:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Сохранить результаты раунда турнира
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const tournamentIdStr = String(tournamentId);
    
    if (!tournamentIdStr || !isValidUUID(tournamentIdStr)) {
      return NextResponse.json(
        { error: 'Некорректный ID турнира' },
        { status: 400 }
      );
    }

    const body: SaveTournamentResultRequest = await request.json();
    const { playerResults, roundNumber } = body;

    if (!Array.isArray(playerResults) || playerResults.length === 0) {
      return NextResponse.json(
        { error: 'Некорректные данные результатов' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Обновляем или создаем записи результатов для каждого игрока
    for (const playerResult of playerResults) {
      // Проверяем, существует ли уже запись для этого игрока в турнире
      const existingResult = await db.query.tournamentResults.findFirst({
        where: and(
          eq(tournamentResults.tournamentId, tournamentIdStr),
          eq(tournamentResults.playerId, playerResult.playerId)
        ),
      });

      if (existingResult) {
        // Обновляем существующую запись
        await db
          .update(tournamentResults)
          .set({
            totalCorrect: existingResult.totalCorrect + playerResult.correctAnswers,
            totalErrors: existingResult.totalErrors + playerResult.errors,
            roundWins: playerResult.correctAnswers > playerResult.errors 
              ? existingResult.roundWins + 1 
              : existingResult.roundWins,
          })
          .where(eq(tournamentResults.id, existingResult.id));
      } else {
        // Создаем новую запись
        await db.insert(tournamentResults).values({
          id: uuidv4(),
          tournamentId: tournamentIdStr,
          playerId: playerResult.playerId,
          isBot: playerResult.isBot,
          botAccuracy: playerResult.botAccuracy || null,
          totalCorrect: playerResult.correctAnswers,
          totalErrors: playerResult.errors,
          roundWins: playerResult.correctAnswers > playerResult.errors ? 1 : 0,
          createdAt: now,
        });
      }
    }

    // Получаем обновленные результаты с ранжированием
    const updatedResults = await db.query.tournamentResults.findMany({
      where: eq(tournamentResults.tournamentId, tournamentIdStr),
      orderBy: (results, { desc }) => [desc(results.totalCorrect)],
    });

    // Обновляем rank для всех участников
    for (let i = 0; i < updatedResults.length; i++) {
      await db
        .update(tournamentResults)
        .set({ rank: i + 1 })
        .where(eq(tournamentResults.id, updatedResults[i].id));
    }

    console.log('🏆 Результаты раунда сохранены:', {
      tournamentId: tournamentIdStr,
      roundNumber,
      playerResults,
    });

    return NextResponse.json({
      success: true,
      tournamentId: tournamentIdStr,
      roundNumber,
      results: updatedResults.map((r, index) => ({
        ...r,
        rank: index + 1,
      })),
    });
  } catch (error) {
    console.error('❌ Ошибка сохранения результатов турнира:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
