import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq, and, desc } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, name, nValue = 2, baseSpeedMs = 2000, minPlayers = 2, maxPlayers = 2, password, addBot, botAccuracy } = body;

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    // Создаем лобби
    const lobbyId = nanoid();
    const lobbyName = name || `Лобби ${lobbyId.slice(0, 6)}`;

    await db.insert(lobbies).values({
      id: lobbyId,
      gameId,
      name: lobbyName,
      status: 'waiting',
      nValue,
      baseSpeedMs,
      minPlayers,
      maxPlayers,
      currentPlayers: 1,
      hostId: session.user.id,
      password: password || null,
      autoStartEnabled: false, // По умолчанию автозапуск выключен
      createdAt: new Date().toISOString(),
    });

    // Добавляем хоста как первого игрока
    await db.insert(lobbyPlayers).values({
      id: nanoid(),
      lobbyId,
      userId: session.user.id,
      name: session.user.name,
      isReady: false,
      isHost: true,
      joinedAt: new Date().toISOString(),
    });

    const [createdLobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    return NextResponse.json({
      success: true,
      lobby: {
        ...createdLobby,
        players: [{
          id: session.user.id,
          userId: session.user.id,
          name: session.user.name,
          isReady: false,
          isHost: true,
          joinedAt: new Date().toISOString(),
        }],
      },
    });
  } catch (error) {
    console.error('[create] Error creating lobby:', error);
    return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем список активных лобби
    const allLobbies = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.status, 'waiting'))
      .orderBy(desc(lobbies.createdAt));

    // Получаем игроков для каждого лобби
    const lobbiesWithPlayers = await Promise.all(
      allLobbies.map(async (lobby) => {
        const players = await db
          .select()
          .from(lobbyPlayers)
          .where(eq(lobbyPlayers.lobbyId, lobby.id));

        return {
          ...lobby,
          currentPlayers: players.length,
          players: players.map((p) => ({
            id: p.userId,
            userId: p.userId,
            name: p.name,
            isReady: Boolean(p.isReady),
            isHost: Boolean(p.isHost),
            joinedAt: p.joinedAt,
          })),
        };
      })
    );

    return NextResponse.json({ success: true, lobbies: lobbiesWithPlayers });
  } catch (error) {
    console.error('[list] Error listing lobbies:', error);
    return NextResponse.json({ error: 'Failed to list lobbies' }, { status: 500 });
  }
}
