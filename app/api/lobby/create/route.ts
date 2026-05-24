import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
      botName = 'Бот',
      userName = 'Игрок'
    } = body;

    if (!gameId) {
      console.error('❌ [lobby/create] Missing gameId');
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    const userId = nanoid();
    const lobbyId = nanoid();
    const lobbyName = name || `Лобби ${lobbyId.slice(0, 6)}`;

    console.log('🔵 [lobby/create] Creating lobby:', { lobbyId, userId, lobbyName });

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

    // Добавляем игрока
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
        ...createdLobby,
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
    return NextResponse.json({ 
      error: 'Failed to create lobby',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

