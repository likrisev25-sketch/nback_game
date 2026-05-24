import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
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

    // Простая вставка без drizzle
    await db.execute(`
      INSERT INTO lobbies (id, game_id, name, status, n_value, base_speed_ms, 
        min_players, max_players, current_players, host_id, auto_start_enabled, 
        created_at, started_at, finished_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      lobbyId, gameId, lobbyName, 'waiting', nValue, baseSpeedMs,
      minPlayers, maxPlayers, 1, userId, false,
      new Date().toISOString(), null, null
    ]);
    
    console.log('✅ [lobby/create] Lobby inserted');

    // Добавляем игрока
    await db.execute(`
      INSERT INTO lobby_players (id, lobby_id, user_id, name, is_ready, is_host, 
        is_bot, bot_accuracy, joined_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      nanoid(), lobbyId, userId, userName, false, true, false, 100, new Date().toISOString()
    ]);
    
    console.log('✅ [lobby/create] Player inserted');

    if (addBot) {
      await db.execute(`
        INSERT INTO lobby_players (id, lobby_id, user_id, name, is_ready, is_host, 
          is_bot, bot_accuracy, joined_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        nanoid(), lobbyId, nanoid(), `${botName} (${botAccuracy}%)`, true, false, true, botAccuracy, new Date().toISOString()
      ]);
      console.log('✅ [lobby/create] Bot added');
    }

    console.log('✅ [lobby/create] Lobby created successfully:', lobbyId);

    return NextResponse.json({
      success: true,
      lobby: {
        id: lobbyId,
        name: lobbyName,
        status: 'waiting',
        nValue,
        baseSpeedMs,
        minPlayers,
        maxPlayers,
        currentPlayers: 1 + (addBot ? 1 : 0),
        hostId: userId,
        players: [
          { id: userId, userId, name: userName, isReady: false, isHost: true, isBot: false },
          ...(addBot ? [{ id: 'bot', userId: 'bot', name: `${botName} (${botAccuracy}%)`, isReady: true, isHost: false, isBot: true }] : [])
        ]
      }
    });
  } catch (error) {
    console.error('❌ [lobby/create] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to create lobby',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

