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
      return NextResponse.json({ error: 'Database not available. Please check DATABASE_URL environment variable.' }, { status: 500 });
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

    console.log('🔵 [lobby/create] Inserting lobby into database...');
    
    try {
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
      
      console.log('✅ [lobby/create] Lobby inserted successfully');
    } catch (insertError) {
      console.error('❌ [lobby/create] Failed to insert lobby:', insertError);
      throw insertError;
    }

    // Добавляем хоста как первого игрока
    console.log('🔵 [lobby/create] Inserting player...');
    try {
      await db.insert(lobbyPlayers).values({
        id: nanoid(),
        lobbyId,
        userId,
        name: userName,
        isReady: false,
        isHost: true,
        joinedAt: new Date().toISOString(),
      });
      
      console.log('✅ [lobby/create] Player inserted successfully');
    } catch (playerError) {
      console.error('❌ [lobby/create] Failed to insert player:', playerError);
      throw playerError;
    }

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
    console.error('❌ [lobby/create] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({ 
      error: 'Failed to create lobby',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

