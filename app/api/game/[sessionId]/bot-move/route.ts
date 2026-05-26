import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences, gameMoves } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

function shouldBotAnswerCorrectly(botAccuracy: number): boolean {
  return Math.random() * 100 < botAccuracy;
}

function checkNBackAnswer(
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): { isCorrect: boolean; isMatch: boolean } {
  const isMatch = stepNumber >= nValue && sequence[stepNumber] === sequence[stepNumber - nValue];
  const isCorrect = playerAnswer === isMatch;
  return { isCorrect, isMatch };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { stepNumber } = body;

    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session || session.status !== 'playing') {
      return NextResponse.json({ error: 'Игра не активна' }, { status: 400 });
    }

    const sequenceData = await db.query.sequences.findFirst({
      where: eq(sequences.sessionId, sessionId),
    });

    if (!sequenceData) {
      return NextResponse.json({ error: 'Последовательность не найдена' }, { status: 404 });
    }

    const positions = JSON.parse(sequenceData.positions) as number[];
    const bots = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    const botMoves = [];

    for (const bot of bots) {
      if (!bot.isBot) continue;

      const isMatch = stepNumber >= session.nValue &&
        positions[stepNumber] === positions[stepNumber - session.nValue];

      const botAnswer = shouldBotAnswerCorrectly(bot.botAccuracy) ? isMatch : !isMatch;
      const { isCorrect } = checkNBackAnswer(
        stepNumber,
        positions,
        botAnswer,
        session.nValue
      );

      const now = new Date().toISOString();

      await db.insert(gameMoves).values({
        id: uuidv4(),
        sessionId: sessionId,
        playerId: bot.id,
        position: positions[stepNumber],
        stepNumber: stepNumber,
        isMatch: isMatch,
        playerAnswer: botAnswer,
        isCorrect: isCorrect,
        createdAt: now,
      });

      if (isCorrect) {
        await db
          .update(gamePlayers)
          .set({ correctAnswers: bot.correctAnswers + 1 })
          .where(eq(gamePlayers.id, bot.id));
      } else {
        await db
          .update(gamePlayers)
          .set({ errors: bot.errors + 1 })
          .where(eq(gamePlayers.id, bot.id));
      }
      
      botMoves.push({
        botId: bot.id,
        answer: botAnswer,
        isCorrect,
      });
    }
      
    return NextResponse.json({ botMoves });
  } catch (error) {
    console.error('Error processing bot move:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
