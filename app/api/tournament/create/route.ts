import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tournaments, tournamentPlayers, gameSessions, gamePlayers, sequences, tournamentResults } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

interface CreateTournamentRequest {
  name: string;
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  maxRounds: number;
  minPlayers?: number;
  maxPlayers?: number;
  password?: string;
  userId: string;
  userName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTournamentRequest = await request.json();
    const { name, nValue, totalSteps, baseSpeedMs, maxRounds, minPlayers = 2, maxPlayers = 4, password, userId, userName } = body;

    const tournamentId = uuidv4();
    const now = new Date().toISOString();

    // Создаем турнир
    const [tournament] = await db
      .insert(tournaments)
      .values({
        id: tournamentId,
        name,
        nValue,
        totalSteps,
        baseSpeedMs,
        maxRounds,
        minPlayers,
        maxPlayers,
        hostId: userId,
        password: password || null,
        status: 'waiting',
        currentRound: 1,
        createdAt: now,
      })
      .returning();

    // Добавляем создателя как игрока
    await db.insert(tournamentPlayers).values({
      id: uuidv4(),
      tournamentId,
      userId,
      name: userName,
      isReady: false,
      isHost: true,
      joinedAt: now,
    });

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
    console.error('Ошибка создания турнира:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

