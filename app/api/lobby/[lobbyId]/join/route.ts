import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { nanoid } from 'nanoid';
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
    const { password } = await request.json();

    // Проверяем существование лобби
    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    // Проверяем пароль если требуется
    if (lobby.password && lobby.password !== password) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    // Проверяем заполненность
    const [playerCount] = await db
      .select({ count: lobbyPlayers.id })
      .from(lobbyPlayers)
      .where(eq(lobbyPlayers.lobbyId, lobbyId));

    if (playerCount && Number(playerCount.count) >= lobby.maxPlayers) {
      return NextResponse.json({ error: 'Lobby is full' }, { status: 400 });
    }

    // Проверяем не состоит ли пользователь уже в лобби
    const existingPlayer = await db
      .select()
      .from(lobbyPlayers)
      .where(
        and(
          eq(lobbyPlayers.lobbyId, lobbyId),
          eq(lobbyPlayers.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingPlayer.length > 0) {
      return NextResponse.json({ error: 'You are already in this lobby' }, { status: 400 });
    }

    // Добавляем игрока
    await db.insert(lobbyPlayers).values({
      id: nanoid(),
      lobbyId,
      userId: session.user.id,
      name: session.user.name,
      isReady: false,
      isHost: false,
      isBot: false,
      botAccuracy: 100,
      joinedAt: new Date().toISOString(),
    });

    // Обновляем счетчик игроков
    await db
      .update(lobbies)
      .set({ currentPlayers: lobby.currentPlayers + 1 })
      .where(eq(lobbies.id, lobbyId));

    return NextResponse.json({
      success: true,
      message: 'Successfully joined lobby',
    });
  } catch (error) {
    console.error('[join] Error joining lobby:', error);
    return NextResponse.json({ error: 'Failed to join lobby' }, { status: 500 });
  }
}
