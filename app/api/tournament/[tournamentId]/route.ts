import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { tournaments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;

    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, tournamentId),
      with: {
        players: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Турнир не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error('Error getting tournament:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const body = await request.json();

    // Обновление турнира
    const [updated] = await db
      .update(tournaments)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tournaments.id, tournamentId))
      .returning();

    return NextResponse.json({ tournament: updated });
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
