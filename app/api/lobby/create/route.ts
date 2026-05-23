import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [lobby/create] POST request received');
    
    if (!db) {
      console.error('❌ [lobby/create] Database not available');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    console.log('🔵 [lobby/create] Request body:', body);
    
    const { 
      gameId,
      name, 
      nValue = 2, 
      baseSpeedMs = 2000, 
      minPlayers = 2, 
      maxPlayers = 2, 
      password,
      addBot = false,
      botAccuracy = 80,
      botName = 'Бот'
    } = body;

    if (!gameId) {
      console.error('❌ [lobby/create] Missing gameId');
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    // Временно используем заглушку для userId (будет заменено на реальную авторизацию)
    const userId = nanoid();
    const userName = body.userName || 'Игрок';
    
    console.log('🔵 [lobby/create] Creating lobby with userId:', userId, 'userName:', userName);

    // Создаем лобби
    const lobbyId = nanoid();
    const lobbyName = name || `Лобби ${lobbyId.slice(0, 6)}`;

    // Вычисляем фактическое максимальное количество игроков
    const actualMaxPlayers = addBot ? maxPlayers + 1 : maxPlayers;

    await db.insert(lobbies).values({
      id: lobbyId,
      gameId,
      name: lobbyName,
      status: 'waiting',
      nValue,
      baseSpeedMs,
      minPlayers: addBot ? Math.max(minPlayers - 1, 1) : minPlayers,
      maxPlayers: actualMaxPlayers,
      currentPlayers: 1,
      hostId: userId,
      password: password || null,
      autoStartEnabled: false,
      createdAt: new Date().toISOString(),
    });

    // Добавляем хоста как первого игрока
    await db.insert(lobbyPlayers).values({
      id: nanoid(),
      lobbyId,
      userId,
      name: userName,
      isReady: false,
      isHost: true,
      joinedAt: new Date().toISOString(),
    });

    // Добавляем бота если запрошено
    if (addBot) {
      const botId = nanoid();
      await db.insert(lobbyPlayers).values({
        id: botId,
        lobbyId,
        userId: botId, // Бот имеет свой собственный ID
        name: `${botName} (${botAccuracy}%)`,
        isReady: true, // Бот всегда готов
        isHost: false,
        joinedAt: new Date().toISOString(),
      });
      console.log('✅ [lobby/create] Bot added:', `${botName} (${botAccuracy}%)`);
    }

    console.log('✅ [lobby/create] Lobby created successfully:', lobbyId);

    const [createdLobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    // Получаем всех игроков
    const players = await db
      .select()
      .from(lobbyPlayers)
      .where(eq(lobbyPlayers.lobbyId, lobbyId));

    return NextResponse.json({
      success: true,
      lobby: {
        ...createdLobby,
        players: players.map((p: typeof lobbyPlayers.$inferSelect) => ({
          id: p.userId,
          userId: p.userId,
          name: p.name,
          isReady: Boolean(p.isReady),
          isHost: Boolean(p.isHost),
          joinedAt: p.joinedAt,
          isBot: p.userId.startsWith('bot_') || (addBot && p.name.includes('Бот')),
        })),
      },
    });
  } catch (error) {
    console.error('❌ [lobby/create] Error creating lobby:', error);
    return NextResponse.json({ error: 'Failed to create lobby' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔵 [lobby/list] GET request received');
    
    if (!db) {
      console.error('❌ [lobby/list] Database not available');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Получаем список активных лобби
    const allLobbies = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.status, 'waiting'))
      .orderBy(desc(lobbies.createdAt));

    console.log('🔵 [lobby/list] Found lobbies:', allLobbies.length);

    // Получаем игроков для каждого лобби
    const lobbiesWithPlayers = await Promise.all(
      allLobbies.map(async (lobby: typeof lobbies.$inferSelect) => {
        const players = await db
          .select()
          .from(lobbyPlayers)
          .where(eq(lobbyPlayers.lobbyId, lobby.id));

        return {
          ...lobby,
          currentPlayers: players.length,
          players: players.map((p: typeof lobbyPlayers.$inferSelect) => ({
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

    console.log('✅ [lobby/list] Returning lobbies:', lobbiesWithPlayers.length);
    return NextResponse.json({ success: true, lobbies: lobbiesWithPlayers });
  } catch (error) {
    console.error('❌ [lobby/list] Error listing lobbies:', error);
    return NextResponse.json({ error: 'Failed to list lobbies' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

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
      allLobbies.map(async (lobby: typeof lobbies.$inferSelect) => {
        const players = await db
          .select()
          .from(lobbyPlayers)
          .where(eq(lobbyPlayers.lobbyId, lobby.id));

        return {
          ...lobby,
          currentPlayers: players.length,
          players: players.map((p: typeof lobbyPlayers.$inferSelect) => ({
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
