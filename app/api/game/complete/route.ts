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
    const body = await request.json();
    const { correctAnswers, errors } = body;

    // Обновляем сессию как завершенную
    await db
      .update(gameSessions)
      .set({
        status: 'finished',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(gameSessions.id, sessionId));

    return NextResponse.json({
      success: true,
      message: 'Игра завершена',
    });
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
