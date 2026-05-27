import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

// Генерация последовательности
function generateNBackSequence(totalSteps: number, nValue: number, gridSize: number = 9): number[] {
  const positions: number[] = [];
  console.log('🔵 Генерация последовательности: totalSteps=', totalSteps, 'nValue=', nValue);
  
  for (let i = 0; i < totalSteps; i++) {
    let position: number;
    
    if (i >= nValue && Math.random() < 0.3) {
      // Совпадение с позицией N шагов назад
      const matchPosition = positions[i - nValue];
      console.log(`  Шаг ${i}: СОВПАДЕНИЕ с шагом ${i - nValue} (позиция ${matchPosition})`);
      position = matchPosition;
    } else {
      // Случайная позиция
      position = Math.floor(Math.random() * gridSize);
      console.log(`  Шаг ${i}: Случайная позиция ${position}`);
    }
    
    positions.push(position);
  }
  
  console.log('🔵 Полная последовательность:', positions);
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
}

// Валидация UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Валидация параметров игры
function validateGameParams(body: CreateGameRequest): { valid: boolean; error?: string } {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return { valid: false, error: 'Некорректное название игры' };
  }
  if (typeof body.nValue !== 'number' || body.nValue < 1 || body.nValue > 5) {
    return { valid: false, error: 'N-значение должно быть от 1 до 5' };
  }
  if (typeof body.totalSteps !== 'number' || body.totalSteps < 10 || body.totalSteps > 100) {
    return { valid: false, error: 'Количество шагов должно быть от 10 до 100' };
  }
  if (typeof body.baseSpeedMs !== 'number' || body.baseSpeedMs < 500 || body.baseSpeedMs > 5000) {
    return { valid: false, error: 'Базовая скорость должна быть от 500 до 5000 мс' };
  }
  if (typeof body.maxPlayers !== 'number' || body.maxPlayers < 2 || body.maxPlayers > 4) {
    return { valid: false, error: 'Максимум игроков должен быть от 2 до 4' };
  }
  if (body.addBot !== undefined && typeof body.addBot !== 'boolean') {
    return { valid: false, error: 'Некорректный параметр бота' };
  }
  if (body.botAccuracy !== undefined && (typeof body.botAccuracy !== 'number' || body.botAccuracy < 50 || body.botAccuracy > 100)) {
    return { valid: false, error: 'Точность бота должна быть от 50 до 100%' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 START: Создание игры');
    const body: CreateGameRequest = await request.json();
    console.log('🔵 Body:', body);
    
    // Валидация параметров
    const validation = validateGameParams(body);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { name, nValue, totalSteps, baseSpeedMs, maxPlayers, addBot, botAccuracy } = body;

    const sessionId = uuidv4();
    console.log('🔵 Generated sessionId:', sessionId);
    
    // Проверка валидности sessionId (опционально)
    if (!isValidUUID(sessionId)) {
      return NextResponse.json(
        { error: 'Некорректный ID сессии' },
        { status: 500 }
      );
    }
    
    const now = new Date().toISOString();

    // Генерируем последовательность
    const positions = generateNBackSequence(totalSteps, nValue);
    console.log('🔵 Generated sequence:', positions.slice(0, 10), '...');

    // Создаём сессию
    console.log('🔵 Inserting session into DB...');
    const [session] = await db
      .insert(gameSessions)
      .values({
        id: sessionId,
        name,
        nValue,
        baseSpeedMs,
        currentSpeedMs: baseSpeedMs,
        maxPlayers: maxPlayers || 2,
        status: 'waiting',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    console.log('🔵 Session created:', session);

    // Сохраняем последовательность
    console.log('🔵 Inserting sequence into DB...');
    await db.insert(sequences).values({
      id: uuidv4(),
      sessionId,
      positions: JSON.stringify(positions),
      totalSteps,
      createdAt: now,
    });
    console.log('🔵 Sequence saved');

    // Добавляем первого игрока (создателя)
    console.log('🔵 Inserting player into DB...');
    const [player] = await db.insert(gamePlayers).values({
      id: uuidv4(),
      sessionId,
      userId: uuidv4(),
      correctAnswers: 0,
      errors: 0,
      isBot: false,
      botAccuracy: 100,
      joinedAt: now,
    }).returning();
    
    console.log('🔵 Player created:', player);

    // Добавляем бота, если запрошено
    if (addBot && maxPlayers > 1) {
      console.log('🤖 Creating bot with accuracy:', botAccuracy);
      const [bot] = await db.insert(gamePlayers).values({
        id: uuidv4(),
        sessionId,
        userId: uuidv4(),
        correctAnswers: 0,
        errors: 0,
        isBot: true,
        botAccuracy: botAccuracy || 80,
        joinedAt: now,
      }).returning();
      
      console.log('🤖 Bot created:', bot);
    }

    console.log('✅ SUCCESS: Game created');

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      playerId: player.id,
      name: session.name,
      nValue: session.nValue,
      baseSpeedMs: session.baseSpeedMs,
      status: session.status,
    });
  } catch (error) {
    console.error('❌ ERROR creating game:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
