import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getSessionFromRequest } from '@/lib/session';

interface JoinGameRequest {
  sessionId: string;
  playerName?: string;
  userId?: string;
}

// Валидация числового ID игры (6 цифр)
function isValidGameId(id: string): boolean {
  return /^\d{6}$/.test(id);
}

export async function POST(request: NextRequest) {
  try {
    const body: JoinGameRequest = await request.json();
    const { sessionId, playerName } = body;

    // Проверяем авторизацию (опционально)
    const session = await getSessionFromRequest(request);
    const authenticatedUserId = session?.user?.id;

    if (!sessionId || typeof sessionId !== 'string' || !isValidGameId(sessionId)) {
      return NextResponse.json(
        { error: 'Некорректный ID игры. Введите 6 цифр.' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    console.log('🔵 [join] Попытка присоединиться к игре:', sessionId);

    // Проверяем сессию
    const gameSession = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionId),
    });

    if (!gameSession) {
      console.error('❌ [join] Сессия не найдена:', sessionId);
      return NextResponse.json(
        { error: 'Сессия не найдена' },
        { status: 404 }
      );
    }

    if (gameSession.status !== 'waiting') {
      console.error('❌ [join] Игра уже началась:', gameSession.status);
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

    if (playerCount >= gameSession.maxPlayers) {
      console.error('❌ [join] Игра полна!');
      return NextResponse.json(
        { error: 'Игра полна' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const playerId = uuidv4();
    const displayName = playerName || session?.user?.name || session?.user?.email?.split('@')[0] || 'Игрок';

    // Добавляем игрока
    const [player] = await db
      .insert(gamePlayers)
      .values({
        id: playerId,
        sessionId,
        userId: authenticatedUserId || playerId, // Связываем с реальным пользователем или генерируем UUID
        name: displayName,
        correctAnswers: 0,
        errors: 0,
        isBot: false,
        botAccuracy: 100,
        isHost: false,
        joinedAt: now,
      })
      .returning();

    console.log('✅ [join] SUCCESS: Player joined');

    return NextResponse.json({
      success: true,
      playerId: player.id,
      playerName: displayName,
      playerCount: playerCount + 1,
      maxPlayers: gameSession.maxPlayers,
    });
  } catch (error) {
    console.error('❌ [join] Ошибка присоединения к игре:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
