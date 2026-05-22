import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gamePlayers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface AddBotRequest {
  sessionId: string;
  accuracy: number; // 0.0 - 1.0
  responseDelayMs: number;
  name?: string;
}

// Валидация числового ID игры (6 цифр)
function isValidGameId(id: string): boolean {
  return /^\d{6}$/.test(id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const sessionIdStr = String(sessionId);
    
    // Валидация sessionId
    if (!sessionIdStr || !isValidGameId(sessionIdStr)) {
      return NextResponse.json(
        { error: 'Некорректный ID игры' },
        { status: 400 }
      );
    }

    const body: AddBotRequest = await request.json();
    const { accuracy, responseDelayMs, name } = body;

    // Валидация параметров
    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 1) {
      return NextResponse.json(
        { error: 'Точность должна быть от 0 до 1' },
        { status: 400 }
      );
    }

    if (typeof responseDelayMs !== 'number' || responseDelayMs < 0 || responseDelayMs > 5000) {
      return NextResponse.json(
        { error: 'Задержка ответа должна быть от 0 до 5000 мс' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const botName = name || `Bot-${Math.round(accuracy * 100)}%`;

    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Создаем бота
    const [bot] = await db.insert(gamePlayers).values({
      id: uuidv4(),
      sessionId: sessionIdStr,
      userId: uuidv4(),
      name: botName,
      correctAnswers: 0,
      errors: 0,
      isBot: true,
      botAccuracy: Math.round(accuracy * 100), // Сохраняем как проценты
      joinedAt: now,
    }).returning();

    console.log('🤖 Бот добавлен в игру:', {
      id: bot.id,
      sessionId: sessionIdStr,
      name: botName,
      accuracy: accuracy * 100 + '%',
      responseDelayMs,
    });

    return NextResponse.json({
      success: true,
      bot: {
        id: bot.id,
        name: name || `Bot-${Math.round(accuracy * 100)}%`,
        accuracy,
        responseDelayMs,
        isBot: true,
      },
    });
  } catch (error) {
    console.error('❌ Ошибка добавления бота:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
