import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nValue, maxPlayers = 4 } = body;

    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const [session] = await db
      .insert(gameSessions)
      .values({
        id: sessionId,
        nValue: nValue || 2,
        maxPlayers,
        status: 'waiting',
        currentSpeedMs: 2000,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      nValue: session.nValue,
      maxPlayers: session.maxPlayers,
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
