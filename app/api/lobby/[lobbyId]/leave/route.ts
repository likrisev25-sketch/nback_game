import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, and, not } from 'drizzle-orm';
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

    // Проверяем существование лобби
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Получаем игрока
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

    // Удаляем игрока
    await db
      .delete(lobbyPlayers)
      .where(
        and(
          eq(lobbyPlayers.lobbyId, lobbyId),
          eq(lobbyPlayers.userId, session.user.id)
        )
      );

    // Если это был хост - передаем права или удаляем лобби
    if (player.isHost) {
        const otherPlayers = await db
          .select()
          .from(lobbyPlayers)
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              not(eq(lobbyPlayers.userId, session.user.id))
            )
          )
          .orderBy(lobbyPlayers.joinedAt)
          .limit(1);

      if (otherPlayers.length > 0) {
        const newHost = otherPlayers[0];
        await db
          .update(lobbyPlayers)
          .set({ isHost: true })
          .where(eq(lobbyPlayers.id, newHost.id));
      } else {
        // Если больше никого нет - удаляем лобби
        await db.delete(lobbies).where(eq(lobbies.id, lobbyId));
        return NextResponse.json({
          success: true,
          message: 'Lobby deleted',
        });
      }
    }

    // Обновляем счетчик игроков
    await db
      .update(lobbies)
      .set({ currentPlayers: lobby.currentPlayers - 1 })
      .where(eq(lobbies.id, lobbyId));

    return NextResponse.json({
      success: true,
      message: 'Successfully left lobby',
    });
  } catch (error) {
    console.error('[leave] Error leaving lobby:', error);
    return NextResponse.json({ error: 'Failed to leave lobby' }, { status: 500 });
  }
}
