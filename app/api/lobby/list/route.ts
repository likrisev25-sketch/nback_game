import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

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
    return NextResponse.json({ error: 'Failed to list lobbies' }, { status: 500 });
  }
}
