import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tournaments, tournamentPlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;

    // Получаем турнир
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

    // Получаем игроков турнира
    const players = await db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tournamentId));

    return NextResponse.json({
      success: true,
      tournament: {
        ...tournament,
        players,
      },
    });
  } catch (error) {
    console.error('Ошибка получения турнира:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
