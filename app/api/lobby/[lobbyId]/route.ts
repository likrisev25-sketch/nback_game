import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ lobbyId: string }> }) {
  try {
    const { lobbyId } = await params;

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const [lobby] = await db
      .select()
      .from(lobbies)
      .where(eq(lobbies.id, lobbyId))
      .limit(1);

    if (!lobby) {
      return NextResponse.json({ error: 'Lobby not found' }, { status: 404 });
    }

    const players = await db
      .select()
      .from(lobbyPlayers)
      .where(eq(lobbyPlayers.lobbyId, lobbyId));

    return NextResponse.json({
      success: true,
      lobby: {
        ...lobby,
        players: players.map((p: typeof lobbyPlayers.$inferSelect) => ({
          id: p.id,
          userId: p.userId,
          name: p.name,
          isReady: Boolean(p.isReady),
          isHost: Boolean(p.isHost),
          joinedAt: p.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('[get] Error getting lobby:', error);
    return NextResponse.json({ error: 'Failed to get lobby' }, { status: 500 });
  }
}
