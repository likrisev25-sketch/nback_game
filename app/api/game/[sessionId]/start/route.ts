import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    // Обновляем статус сессии
    await db
      .update(gameSessions)
      .set({
        status: 'playing',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(gameSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: 'Игра запущена',
      sessionId,
    });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
