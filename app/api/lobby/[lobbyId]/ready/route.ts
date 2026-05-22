import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ lobbyId: string }> }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { lobbyId } = await params;
    const { isReady } = await request.json();

    // Проверяем существование лобби
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Проверяем что игрок в лобби
    const [player] = await db
      .select()
      .from(lobbyPlayers)
      .where(
        and(
          eq(lobbyPlayers.lobbyId, lobbyId),
          eq(lobbyPlayers.userId, session.user.id)
        )
      )
      .limit(1);

    if (!player) {
      return NextResponse.json({ error: 'You are not in this lobby' }, { status: 404 });
    }

    // Обновляем статус готовности
    await db
      .update(lobbyPlayers)
      .set({ isReady })
      .where(
        and(
          eq(lobbyPlayers.lobbyId, lobbyId),
          eq(lobbyPlayers.userId, session.user.id)
        )
      );

    // Проверяем готовы ли все игроки
    const allPlayers = await db
      .select()
      .from(lobbyPlayers)
      .where(eq(lobbyPlayers.lobbyId, lobbyId));

    const allReady = allPlayers.every((p: typeof lobbyPlayers.$inferSelect) => p.isReady);

    if (allReady && lobby.status === 'waiting') {
      // Все готовы - возвращаем сигнал для запуска countdown
      return NextResponse.json({
        success: true,
        allReady: true,
        message: 'All players ready! Starting countdown...',
      });
    }

    return NextResponse.json({
      success: true,
      allReady: false,
    });
  } catch (error) {
    console.error('[ready] Error updating ready status:', error);
    return NextResponse.json({ error: 'Failed to update ready status' }, { status: 500 });
  }
}
