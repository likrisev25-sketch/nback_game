import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { sequences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const sequenceData = await db.query.sequences.findFirst({
      where: eq(sequences.sessionId, sessionId),
    });

    if (!sequenceData) {
      return NextResponse.json(
        { error: 'Последовательность не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sequence: JSON.parse(sequenceData.positions) as number[],
    });
  } catch (error) {
    console.error('Error getting sequence:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
