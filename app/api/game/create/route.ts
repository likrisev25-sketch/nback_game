import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { getSessionFromRequest } from '@/lib/session';

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

interface CreateGameRequest {
  name: string;
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  maxPlayers: number;
  addBot: boolean;
  botAccuracy: number;
  userId?: string;
  playerName?: string;
}

// Генерация 6-значного числового ID
function generateNumericId(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 START: Создание игры');
    const body: CreateGameRequest = await request.json();
    
    // Проверяем авторизацию (опционально)
    const session = await getSessionFromRequest(request);
    const authenticatedUserId = session?.user?.id;
    
    const { name, nValue, totalSteps, baseSpeedMs, maxPlayers, addBot, botAccuracy, playerName } = body;

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Генерируем уникальный 6-значный числовой ID с проверкой на коллизии
    let sessionId: string;
    let attempts = 0;
    do {
      sessionId = generateNumericId(6);
      attempts++;
      const existing = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, sessionId),
      });
      if (!existing) break;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Не удалось сгенерировать уникальный ID игры' },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    // Генерируем последовательность
    const positions = generateNBackSequence(totalSteps, nValue);

    // Создаём сессию
    const [gameSession] = await db
      .insert(gameSessions)
      .values({
        id: sessionId,
        name: name || 'Без названия',
        nValue,
        baseSpeedMs,
        currentSpeedMs: baseSpeedMs,
        maxPlayers: maxPlayers || 2,
        status: 'waiting',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Сохраняем последовательность
    await db.insert(sequences).values({
      id: uuidv4(),
      sessionId,
      positions: JSON.stringify(positions),
      totalSteps,
      createdAt: now,
    });

    // Добавляем создателя игры
    const creatorId = uuidv4();
    const displayName = playerName || session?.user?.name || session?.user?.email?.split('@')[0] || 'Игрок';
    
    const [player] = await db.insert(gamePlayers).values({
      id: creatorId,
      sessionId,
      userId: authenticatedUserId || creatorId, // Связываем с реальным пользователем или генерируем UUID
      name: displayName,
      correctAnswers: 0,
      errors: 0,
      isBot: false,
      botAccuracy: 100,
      isHost: true,
      joinedAt: now,
    }).returning();
    
    // Добавляем бота, если запрошено
    if (addBot && maxPlayers > 1) {
      await db.insert(gamePlayers).values({
        id: uuidv4(),
        sessionId,
        userId: uuidv4(),
        name: `Бот ${botAccuracy || 80}%`,
        correctAnswers: 0,
        errors: 0,
        isBot: true,
        botAccuracy: botAccuracy || 80,
        joinedAt: now,
      });
    }

    console.log('✅ SUCCESS: Game created');

    return NextResponse.json({
      success: true,
      sessionId: gameSession.id,
      playerId: player.id,
      name: gameSession.name,
      nValue: gameSession.nValue,
      baseSpeedMs: gameSession.baseSpeedMs,
      status: gameSession.status,
    });
  } catch (error) {
    console.error('❌ ERROR creating game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
