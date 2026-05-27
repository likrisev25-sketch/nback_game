import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, sequences, gamePlayers, gameMoves } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface AnswerRequest {
  sessionId: string;
  playerId: string;
  position: number;
  stepNumber: number;
  playerAnswer: boolean;
}

function checkNBackAnswer(
  position: number,
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): { isCorrect: boolean; isMatch: boolean } {
  if (stepNumber >= nValue) {
    const currentPos = sequence[stepNumber];
    const nStepsBackPos = sequence[stepNumber - nValue];
    const isMatch = currentPos === nStepsBackPos;
    const isCorrect = playerAnswer === isMatch;
    return { isCorrect, isMatch };
  } else {
    return { isCorrect: playerAnswer === false, isMatch: false };
  }
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json() as AnswerRequest;
    
    if (!body.playerId || !isValidUUID(body.playerId)) {
      return NextResponse.json({ error: 'Некорректный ID игрока' }, { status: 400 });
    }
    if (typeof body.position !== 'number' || body.position < 0 || body.position > 8) {
      return NextResponse.json({ error: 'Позиция должна быть от 0 до 8' }, { status: 400 });
    }
    if (typeof body.stepNumber !== 'number' || body.stepNumber < 0) {
      return NextResponse.json({ error: 'Номер шага должен быть неотрицательным' }, { status: 400 });
    }
    if (typeof body.playerAnswer !== 'boolean') {
      return NextResponse.json({ error: 'Ответ игрока должен быть булевым' }, { status: 400 });
    }

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
    const nValue = session.nValue;

    const player = await db.query.gamePlayers.findFirst({
      where: eq(gamePlayers.id, body.playerId),
    });

    if (!player) {
      return NextResponse.json({ error: 'Игрок не найден' }, { status: 404 });
    }

    const { isCorrect, isMatch } = checkNBackAnswer(
      body.position,
      body.stepNumber,
      positions,
      body.playerAnswer,
      nValue
    );

    const now = new Date().toISOString();

    const existingMove = await db.query.gameMoves.findFirst({
      where: (moves, { and, eq }) => and(
        eq(moves.sessionId, sessionId),
        eq(moves.playerId, body.playerId),
        eq(moves.stepNumber, body.stepNumber)
      ),
    });

    if (existingMove) {
      return NextResponse.json({
        isCorrect: existingMove.isCorrect,
        isMatch: existingMove.isMatch,
        correctAnswers: player.correctAnswers,
        errors: player.errors,
        speedIncreased: false,
        newSpeedMs: session.currentSpeedMs,
        duplicate: true,
      });
    }

    await db.insert(gameMoves).values({
      id: uuidv4(),
      sessionId,
      playerId: body.playerId,
      position: body.position,
      stepNumber: body.stepNumber,
      isMatch,
      playerAnswer: body.playerAnswer,
      isCorrect,
      createdAt: now,
    }).onConflictDoNothing();

    if (isCorrect) {
      await db.update(gamePlayers)
        .set({ correctAnswers: sql`${gamePlayers.correctAnswers} + 1` })
        .where(eq(gamePlayers.id, body.playerId));
    } else {
      await db.update(gamePlayers)
        .set({ errors: sql`${gamePlayers.errors} + 1` })
        .where(eq(gamePlayers.id, body.playerId));
    }

    const updatedPlayer = await db.query.gamePlayers.findFirst({
      where: eq(gamePlayers.id, body.playerId),
    });

    let speedIncreased = false;
    let newSpeedMs = session.currentSpeedMs;
    
    const playerErrors = updatedPlayer?.errors ?? 0;
    if (playerErrors > 0 && playerErrors % 3 === 0) {
      newSpeedMs = Math.max(500, Math.floor(session.currentSpeedMs * 0.9));
      await db.update(gameSessions)
        .set({ currentSpeedMs: newSpeedMs })
        .where(eq(gameSessions.id, sessionId));
      speedIncreased = true;
    }

    return NextResponse.json({
      isCorrect,
      isMatch,
      correctAnswers: updatedPlayer?.correctAnswers ?? 0,
      errors: updatedPlayer?.errors ?? 0,
      speedIncreased,
      newSpeedMs: speedIncreased ? newSpeedMs : session.currentSpeedMs,
    });
  } catch (error) {
    console.error('Error processing answer:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
