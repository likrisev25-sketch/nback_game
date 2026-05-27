import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface JoinGameRequest {
  sessionId: string;
}

// Валидация UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Валидация параметров присоединения
function validateJoinParams(body: JoinRequest): { valid: boolean; error?: string } {
  if (!body.sessionId || typeof body.sessionId !== 'string' || !isValidUUID(body.sessionId)) {
    return { valid: false, error: 'Некорректный ID сессии' };
  }
  if (!body.playerName || typeof body.playerName !== 'string' || body.playerName.trim().length === 0) {
    return { valid: false, error: 'Введите имя игрока' };
  }
  if (body.playerName.length > 50) {
    return { valid: false, error: 'Имя игрока слишком длинное (максимум 50 символов)' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body: JoinGameRequest & { playerName: string } = await request.json();
    const { sessionId, playerName } = body;

    // Валидация параметров
    const validation = validateJoinParams(body);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('🔵 [join] Попытка присоединиться к игре:', sessionId);
    console.log('🔵 [join] Имя игрока:', playerName);

    // Проверяем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!session) {
      console.error('❌ [join] Сессия не найдена:', sessionId);
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    if (session.status !== 'waiting') {
      console.error('❌ [join] Игра уже началась:', session.status);
      return NextResponse.json(
        { error: 'Игра уже началась' },
        { status: 400 }
      );
    }

    // Получаем текущее количество игроков
    const currentPlayers = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionId),
    });

    const playerCount = currentPlayers.length;
    console.log('🔵 [join] Текущее количество игроков:', playerCount, '/', session.maxPlayers);

    if (playerCount >= session.maxPlayers) {
      console.error('❌ [join] Игра полна!');
      return NextResponse.json(
        { error: 'Игра полна' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Добавляем игрока
    console.log('🔵 [join] Inserting player into DB...');
    const [player] = await db
      .insert(gamePlayers)
      .values({
        id: uuidv4(),
        sessionId,
        userId: uuidv4(),
        correctAnswers: 0,
        errors: 0,
        isBot: false,
        botAccuracy: 100,
        joinedAt: now,
      })
      .returning();

    console.log('🔵 [join] Player created:', player);
    console.log('✅ [join] SUCCESS: Player joined');

    return NextResponse.json({
      success: true,
      playerId: player.id,
      playerName: playerName,
      playerCount: playerCount + 1,
      maxPlayers: session.maxPlayers,
    });
  } catch (error) {
    console.error('❌ [join] Ошибка присоединения к игре:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
