import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gamePlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { stepNumber } = body;

    const bots = await db.query.gamePlayers.findMany({
      where: and(
        eq(gamePlayers.sessionId, sessionId),
        eq(gamePlayers.isBot, true)
      ),
    });

    const botMoves = await Promise.all(
      bots.map(async (bot) => {
        const shouldMatch = Math.random() * 100 < bot.botAccuracy;
        
        if (shouldMatch) {
          const success = Math.random() > 0.3;
          await db.update(gamePlayers)
            .set({
              correctAnswers: success ? bot.correctAnswers + 1 : bot.correctAnswers,
              errors: success ? bot.errors : bot.errors + 1,
            })
            .where(eq(gamePlayers.id, bot.id));
          
          return { botId: bot.id, matched: true, correct: success };
        }
        
        return { botId: bot.id, matched: false };
      })
    );

    return NextResponse.json({ success: true, botMoves });
  } catch (error) {
    console.error('Error processing bot move:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
