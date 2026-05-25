import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [lobby/create] POST request received');
    
    if (!db) {
      console.error('❌ [lobby/create] Database not available');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Получаем пользователя из сессии
    console.log('🔵 [lobby/create] Getting session from request...');
    const session = await getSessionFromRequest(request);
    console.log('🔵 [lobby/create] Session result:', session ? 'found' : 'not found');
    
    if (!session?.user?.id) {
      console.error('❌ [lobby/create] User not authenticated, session:', session);
      return NextResponse.json(
        { error: 'Необходимо авторизоваться для создания лобби' },
        { status: 401 }
      );
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

    // Используем реальный userId из сессии
    const userId = session.user.id;
    const lobbyId = nanoid();
    const lobbyName = name || `Лобби ${lobbyId.slice(0, 6)}`;
    const userName = session.user.name || 'Игрок';

    console.log('🔵 [lobby/create] Creating lobby:', { lobbyId, userId, lobbyName, userName });

    const now = new Date().toISOString();

    // Создаем лобби через drizzle
    await db.insert(lobbies).values({
      id: lobbyId,
      gameId,
      name: lobbyName,
      status: 'waiting',
      nValue,
      baseSpeedMs,
      minPlayers,
      maxPlayers,
      currentPlayers: 1 + (addBot ? 1 : 0),
      hostId: userId,
      password: password || null,
      autoStartEnabled: false,
      createdAt: now,
      startedAt: null,
      finishedAt: null,
    });
    
    console.log('✅ [lobby/create] Lobby inserted');

    // Добавляем игрока с реальным userId
    await db.insert(lobbyPlayers).values({
      id: nanoid(),
      lobbyId,
      userId,
      name: userName,
      isReady: false,
      isHost: true,
      isBot: false,
      botAccuracy: 100,
      joinedAt: now,
    });
    
    console.log('✅ [lobby/create] Player inserted');

    // Добавляем бота если запрошено
    if (addBot) {
      await db.insert(lobbyPlayers).values({
        id: nanoid(),
        lobbyId,
        userId: `bot_${nanoid()}`,
        name: `${botName} (${botAccuracy}%)`,
        isReady: true,
        isHost: false,
        isBot: true,
        botAccuracy,
        joinedAt: now,
      });
      console.log('✅ [lobby/create] Bot added');
    }

    console.log('✅ [lobby/create] Lobby created successfully:', lobbyId);

    // Получаем созданное лобби с игроками
    const [createdLobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    const players = await db
      .select()
      .from(lobbyPlayers)
      .where(eq(lobbyPlayers.lobbyId, lobbyId));

    return NextResponse.json({
      success: true,
      lobby: {
        id: createdLobby.id,
        name: createdLobby.name,
        status: createdLobby.status,
        nValue: createdLobby.nValue,
        baseSpeedMs: createdLobby.baseSpeedMs,
        minPlayers: createdLobby.minPlayers,
        maxPlayers: createdLobby.maxPlayers,
        currentPlayers: players.length,
        hostId: createdLobby.hostId,
        autoStartEnabled: createdLobby.autoStartEnabled,
        createdAt: createdLobby.createdAt,
        players: players.map(p => ({
          id: p.userId,
          userId: p.userId,
          name: p.name,
          isReady: Boolean(p.isReady),
          isHost: Boolean(p.isHost),
          isBot: Boolean(p.isBot),
          botAccuracy: p.botAccuracy,
          joinedAt: p.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('❌ [lobby/create] Error:', error);
    console.error('❌ [lobby/create] Error stack:', (error as Error).stack);
    return NextResponse.json({ 
      error: 'Failed to create lobby',
      details: error instanceof Error ? error.message : String(error),
      stack: (error as Error).stack
    }, { status: 500 });
  }
}

