import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tournaments, tournamentPlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface JoinTournamentRequest {
  tournamentId: string;
  userId: string;
  userName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: JoinTournamentRequest = await request.json();
    const { tournamentId, userId, userName } = body;

    // Проверяем существование турнира
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      return NextResponse.json(
        { error: 'Турнир не найден' },
        { status: 404 }
      );
    }

    // Проверяем статус
    if (tournament.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Турнир уже начался или завершен' },
        { status: 400 }
      );
    }

    // Проверяем количество игроков
    const existingPlayers = await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tournamentId));

    if (existingPlayers.length >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: 'Турнир заполнен' },
        { status: 400 }
      );
    }

    // Проверяем не зарегистрирован ли уже игрок
    const existingPlayer = await db
      .select()
      .from(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournamentId, tournamentId),
          eq(tournamentPlayers.userId, userId)
        )
      )
      .limit(1);

    if (existingPlayer.length > 0) {
      return NextResponse.json(
        { error: 'Вы уже присоединились к этому турниру' },
        { status: 400 }
      );
    }

    // Добавляем игрока в турнир
    const now = new Date().toISOString();
    await db.insert(tournamentPlayers).values({
      id: uuidv4(),
      tournamentId,
      userId,
      name: userName,
      isReady: false,
      isHost: false,
      joinedAt: now,
    });

    // Обновляем текущее количество игроков
    await db
      .update(tournaments)
      .set({
        currentPlayers: existingPlayers.length + 1,
      })
      .where(eq(tournaments.id, tournamentId));

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        nValue: tournament.nValue,
        totalSteps: tournament.totalSteps,
        baseSpeedMs: tournament.baseSpeedMs,
        maxRounds: tournament.maxRounds,
        currentRound: tournament.currentRound,
        status: tournament.status,
        minPlayers: tournament.minPlayers,
        maxPlayers: tournament.maxPlayers,
        createdAt: tournament.createdAt,
      },
    });
  } catch (error) {
    console.error('Ошибка присоединения к турниру:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
