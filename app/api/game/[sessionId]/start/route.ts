import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';

// Генерация последовательности
function generateNBackSequence(totalSteps: number, nValue: number, gridSize: number = 9): number[] {
  const positions: number[] = [];
  
  for (let i = 0; i < totalSteps; i++) {
    let position: number;
    
    if (i >= nValue && Math.random() < 0.3) {
      const matchPosition = positions[i - nValue];
      position = matchPosition;
    } else {
      position = Math.floor(Math.random() * gridSize);
    }
    
    positions.push(position);
  }
  
  return positions;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('🔵 START: Запуск игры для sessionId:', sessionId);

    // Проверяем авторизацию запрашивающего
    const session = await getSessionFromRequest(request);
    const userId = session?.user?.id;

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Проверяем существование сессии
    console.log('🔵 Checking if session exists in DB...');
    const gameSession = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    console.log('🔵 Session from DB:', gameSession);

    if (!gameSession) {
      console.error('❌ Session not found in database!');
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    if (gameSession.status === 'completed') {
      return NextResponse.json(
        { error: 'Игра завершена' },
        { status: 400 }
      );
    }

    if (gameSession.status === 'playing') {
      // Игра уже запущена, возвращаем успех (идем дальше)
      console.log('🔵 Game already playing, returning success');
      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, sessionId),
      });
      return NextResponse.json({
        success: true,
        message: 'Игра уже запущена',
        sessionId,
        playerCount: players.length,
      });
    }

    if (gameSession.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Неверный статус сессии' },
        { status: 400 }
      );
    }

    // Проверяем количество игроков
    console.log('🔵 Checking players...');
    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    console.log('🔵 Players count:', players.length);

    if (players.length < 1) {
      return NextResponse.json(
        { error: 'Нужен минимум 1 игрок' },
        { status: 400 }
      );
    }

    // Проверяем что запрашивающий является хостом (если авторизован)
    // Для неавторизованных игроков разрешаем старт без проверки хоста
    if (userId) {
      const hostPlayer = players.find((p: typeof gamePlayers.$inferSelect) => p.isHost);
      if (hostPlayer && hostPlayer.userId !== userId) {
        return NextResponse.json(
          { error: 'Только создатель игры может начать игру' },
          { status: 403 }
        );
      }
    }

    // Генерируем последовательность
    const totalSteps = 30; // Можно сделать настраиваемым
    const positions = generateNBackSequence(totalSteps, gameSession.nValue);

    // Сохраняем последовательность
    const now = new Date().toISOString();
    await db.insert(sequences).values({
      id: uuidv4(),
      sessionId,
      positions: JSON.stringify(positions),
      totalSteps,
      createdAt: now,
    });

    console.log('✅ Sequence generated and saved:', positions);

    // Обновляем статус сессии
    console.log('🔵 Updating session status to playing...');
    await db
      .update(gameSessions)
      .set({
        status: 'playing',
        updatedAt: now,
      })
      .where(eq(gameSessions.id, sessionId));

    console.log('✅ SUCCESS: Game started');

    return NextResponse.json({
      success: true,
      message: 'Игра началась',
      sessionId,
      playerCount: players.length,
    });
  } catch (error) {
    console.error('❌ ERROR starting game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
