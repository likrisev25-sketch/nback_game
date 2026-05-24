import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('🔵 [lobby/list] GET request received');
    console.log('🔵 [lobby/list] DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('🔵 [lobby/list] db object exists:', !!db);
    
    if (!db) {
      console.error('❌ [lobby/list] Database not available');
      return NextResponse.json({ 
        error: 'Database not available. Please check DATABASE_URL environment variable on Vercel.',
        details: 'db is null/undefined'
      }, { status: 500 });
    }

    console.log('🔵 [lobby/list] Attempting to query lobbies table...');
    
    // Получаем список активных лобби
    const allLobbies = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.status, 'waiting'))
      .orderBy(desc(lobbies.createdAt));

    console.log('✅ [lobby/list] Found lobbies:', allLobbies.length);

    // Получаем игроков для каждого лобби
    const lobbiesWithPlayers = await Promise.all(
      allLobbies.map(async (lobby: typeof lobbies.$inferSelect) => {
        const players = await db
          .select()
          .from(lobbyPlayers)
          .where(eq(lobbyPlayers.lobbyId, lobby.id));

        return {
          id: lobby.id,
          name: lobby.name,
          status: lobby.status,
          nValue: lobby.nValue,
          baseSpeedMs: lobby.baseSpeedMs,
          minPlayers: lobby.minPlayers,
          maxPlayers: lobby.maxPlayers,
          currentPlayers: players.length,
          hostId: lobby.hostId,
          autoStartEnabled: lobby.autoStartEnabled,
          createdAt: lobby.createdAt,
          players: players.map((p: typeof lobbyPlayers.$inferSelect) => ({
            id: p.userId,
            userId: p.userId,
            name: p.name,
            isReady: Boolean(p.isReady),
            isHost: Boolean(p.isHost),
            isBot: Boolean(p.isBot),
            botAccuracy: p.botAccuracy,
            joinedAt: p.joinedAt,
          })),
        };
      })
    );

    console.log('✅ [lobby/list] Returning lobbies:', lobbiesWithPlayers.length);
    return NextResponse.json({ success: true, lobbies: lobbiesWithPlayers });
  } catch (error) {
    console.error('❌ [lobby/list] Error listing lobbies:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack';
    
    console.error('❌ [lobby/list] Error message:', errorMessage);
    console.error('❌ [lobby/list] Error stack:', errorStack);
    
    return NextResponse.json({ 
      error: 'Failed to list lobbies',
      details: errorMessage,
      stack: errorStack.substring(0, 500) // Ограничиваем длину
    }, { status: 500 });
  }
}
