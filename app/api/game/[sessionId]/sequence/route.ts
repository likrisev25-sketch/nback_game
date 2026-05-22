import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { sequences, gameSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionIdStr = String(sessionId);

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Получаем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionIdStr),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    // Получаем последовательность
    const sequenceData = await db.query.sequences.findFirst({
      where: eq(sequences.sessionId, sessionIdStr),
    });

    if (!sequenceData) {
      return NextResponse.json(
        { error: 'Последовательность не найдена' },
        { status: 404 }
      );
    }

    const positions = JSON.parse(String(sequenceData.positions)) as number[];

    return NextResponse.json({
      success: true,
      sequence: positions,
      totalSteps: sequenceData.totalSteps,
      nValue: session.nValue,
    });
  } catch (error) {
    console.error('Ошибка получения последовательности:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
