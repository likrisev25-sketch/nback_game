import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tournaments, tournamentPlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Получаем все турниры со статусом 'waiting'
    const waitingTournaments = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        nValue: tournaments.nValue,
        totalSteps: tournaments.totalSteps,
        baseSpeedMs: tournaments.baseSpeedMs,
        maxRounds: tournaments.maxRounds,
        currentRound: tournaments.currentRound,
        status: tournaments.status,
        minPlayers: tournaments.minPlayers,
        maxPlayers: tournaments.maxPlayers,
        currentPlayers: tournaments.currentPlayers,
        hostId: tournaments.hostId,
        createdAt: tournaments.createdAt,
      })
      .from(tournaments)
      .where(eq(tournaments.status, 'waiting'));

    // Для каждого турнира получаем количество игроков
    const tournamentsWithPlayers = await Promise.all(
      waitingTournaments.map(async (tournament) => {
        const players = await db
          .select()
          .from(tournamentPlayers)
          .where(eq(tournamentPlayers.tournamentId, tournament.id));

        return {
          ...tournament,
          currentPlayers: players.length,
          players: players.map((p) => ({
            name: p.name,
            isHost: p.isHost,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      tournaments: tournamentsWithPlayers,
    });
  } catch (error) {
    console.error('Ошибка получения списка турниров:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
