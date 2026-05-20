import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import * as schema from '@/db/schema';
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

// Функция проверки ответа
function checkNBackAnswer(
  position: number,
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): { isCorrect: boolean; isMatch: boolean } {
  console.log('🔍 checkNBackAnswer:');
  console.log('  stepNumber:', stepNumber);
  console.log('  nValue:', nValue);
  console.log('  sequence:', sequence.slice(0, 15));
  
  // Проверяем, есть ли совпадение N шагов назад
  if (stepNumber >= nValue) {
    const currentPos = sequence[stepNumber];
    const nStepsBackPos = sequence[stepNumber - nValue];
    const isMatch = currentPos === nStepsBackPos;
    
    console.log('  currentPos (sequence[', stepNumber, ']):', currentPos);
    console.log('  nStepsBackPos (sequence[', stepNumber - nValue, ']):', nStepsBackPos);
    console.log('  isMatch (совпадают?):', isMatch);
    
    const isCorrect = playerAnswer === isMatch;
    console.log('  playerAnswer:', playerAnswer);
    console.log('  isCorrect (playerAnswer === isMatch):', isCorrect);

    return { isCorrect, isMatch };
  } else {
    // На первых N шагах не может быть совпадений
    console.log('  stepNumber < nValue, совпадений быть не может');
    console.log('  playerAnswer:', playerAnswer);
    console.log('  isMatch: false');
    console.log('  isCorrect (playerAnswer === false):', playerAnswer === false);
    
    return { isCorrect: playerAnswer === false, isMatch: false };
  }
}

// Валидация числового ID игры (6 цифр)
function isValidGameId(id: string): boolean {
  return /^\d{6}$/.test(id);
}

// Валидация UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Валидация параметров ответа
function validateAnswerParams(body: AnswerRequest): { valid: boolean; error?: string } {
  if (!body.playerId || typeof body.playerId !== 'string' || !isValidUUID(body.playerId)) {
    return { valid: false, error: 'Некорректный ID игрока' };
  }
  if (typeof body.position !== 'number' || body.position < 0 || body.position > 8) {
    return { valid: false, error: 'Позиция должна быть от 0 до 8' };
  }
  if (typeof body.stepNumber !== 'number' || body.stepNumber < 0) {
    return { valid: false, error: 'Номер шага должен быть неотрицательным' };
  }
  if (typeof body.playerAnswer !== 'boolean') {
    return { valid: false, error: 'Ответ игрока должен быть булевым значением' };
  }
  return { valid: true };
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
      console.error('❌ Некорректный sessionId:', sessionIdStr);
      return NextResponse.json(
        { error: 'Некорректный ID игры' },
        { status: 400 }
      );
    }

    console.log('🎯 START: Обработка ответа для sessionId:', sessionIdStr);
    
    const body = await request.json() as AnswerRequest;
    
    // Валидация параметров
    const validation = validateAnswerParams(body);
    if (!validation.valid) {
      console.log('❌ Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const playerIdStr = String(body.playerId);
    const position = Number(body.position);
    const stepNumber = Number(body.stepNumber);
    const playerAnswer = Boolean(body.playerAnswer);

    console.log('📥 Body:', { playerId: playerIdStr, position, stepNumber, playerAnswer });

    // Проверяем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionIdStr),
    });

    console.log('🔍 Session:', session);

    if (!session || session.status !== 'playing') {
      console.error('❌ Игра не активна');
      return NextResponse.json(
        { error: 'Игра не активна' },
        { status: 400 }
      );
    }

    // Получаем последовательность
    const sequenceData = await db.query.sequences.findFirst({
      where: eq(sequences.sessionId, sessionIdStr),
    });

    console.log('🔍 Sequence data exists:', !!sequenceData);

    if (!sequenceData) {
      console.error('❌ Последовательность не найдена');
      return NextResponse.json(
        { error: 'Последовательность не найдена' },
        { status: 404 }
      );
    }

    const positions = JSON.parse(String(sequenceData.positions)) as number[];
    const nValue = session.nValue;

    console.log('🔢 Positions:', positions);
    console.log('🔢 nValue:', nValue);

    // Проверяем, существует ли игрок
    const requestingPlayer = await db.query.gamePlayers.findFirst({
      where: eq(gamePlayers.id, playerIdStr),
    });

    if (!requestingPlayer) {
      return NextResponse.json(
        { error: 'Игрок не найден' },
        { status: 404 }
      );
    }

    // Получаем всех игроков
    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionIdStr),
    });

    console.log('🔍 Players in session:', players.map((p: typeof gamePlayers.$inferSelect) => ({ id: p.id, name: p.name, isBot: p.isBot, correctAnswers: p.correctAnswers })));

    const { isCorrect, isMatch } = checkNBackAnswer(
      position,
      stepNumber,
      positions,
      playerAnswer,
      nValue
    );

    console.log('✅ Проверка ответа:', { isCorrect, isMatch });
    console.log('  Ожидалось: игрок должен нажимать, когда position совпадает с N шагов назад');
    console.log('  isMatch (было совпадение):', isMatch);
    console.log('  playerAnswer (ответ игрока):', playerAnswer);
    console.log('  isCorrect (правильно ли):', isCorrect);

    const now = new Date().toISOString();

    // Проверяем, не отправлял ли игрок уже ответ на этот шаг (после проверки ответа)
    console.log('🔍 Проверяем дубликаты ответа...');
    const existingMove = await db.query.gameMoves.findFirst({
      where: (moves, { and, eq }) => and(
        eq(moves.sessionId, sessionIdStr),
        eq(moves.playerId, playerIdStr),
        eq(moves.stepNumber, stepNumber)
      ),
    });

    if (existingMove) {
      console.log('⛔ Ответ на этот шаг уже был отправлен! Возвращаем сохранённый результат');
      return NextResponse.json({
        isCorrect: existingMove.isCorrect,
        isMatch: existingMove.isMatch,
        correctAnswers: existingMove.isCorrect ? (await db.query.gamePlayers.findFirst({
          where: eq(gamePlayers.id, playerIdStr),
        }))?.correctAnswers || 0 : 0,
        errors: existingMove.isCorrect ? 0 : (await db.query.gamePlayers.findFirst({
          where: eq(gamePlayers.id, playerIdStr),
        }))?.errors || 0,
        speedIncreased: false,
        newSpeedMs: session.currentSpeedMs,
        duplicate: true,
      });
    }

    // Сохраняем ход с использованием INSERT ... ON CONFLICT для атомарности
    // returning() вернет пустой массив если произошел конфликт (ход уже существует)
    console.log('💾 Сохраняем ход в БД...');
    const insertedMoves = await db.insert(gameMoves).values({
      id: uuidv4(),
      sessionId: sessionIdStr,
      playerId: playerIdStr,
      position,
      stepNumber,
      isMatch,
      playerAnswer,
      isCorrect,
      createdAt: now,
    }).onConflictDoNothing().returning();

    const moveInserted = insertedMoves.length > 0;
    console.log(moveInserted ? '✅ Ход сохранён' : '⛔ Ход уже существует (конфликт)');

    if (!moveInserted) {
      // Ход уже существовал - возвращаем существующий результат без обновления статистики
      const fallbackMove = await db.query.gameMoves.findFirst({
        where: (moves, { and, eq }) => and(
          eq(moves.sessionId, sessionIdStr),
          eq(moves.playerId, playerIdStr),
          eq(moves.stepNumber, stepNumber)
        ),
      });
      if (fallbackMove) {
        const playerStats = await db.query.gamePlayers.findFirst({
          where: eq(gamePlayers.id, playerIdStr),
        });
        return NextResponse.json({
          isCorrect: fallbackMove.isCorrect,
          isMatch: fallbackMove.isMatch,
          correctAnswers: playerStats?.correctAnswers ?? 0,
          errors: playerStats?.errors ?? 0,
          speedIncreased: false,
          newSpeedMs: session.currentSpeedMs,
          duplicate: true,
        });
      }
    }

    // Обновляем статистику игрока ТОЛЬКО если ход был вставлен впервые
    // НОВАЯ ЛОГИКА:
    // - Очки (+1 correctAnswers) только за активное правильное нажатие на совпадение
    // - Ошибка (+1 errors) за ложное нажатие или пропуск совпадения
    // - Правильное бездействие (не нажал, когда нет совпадения) = 0 очков, 0 ошибок
    let statsUpdated = false;
    if (moveInserted) {
      console.log('📊 Обновляем статистику игрока...');
      console.log('  playerIdStr:', playerIdStr);
      console.log('  playerAnswer:', playerAnswer, '| isMatch:', isMatch);
      
      // Очки ТОЛЬКО за активное нажатие на реальное совпадение
      if (playerAnswer === true && isMatch === true) {
        await db
          .update(gamePlayers)
          .set({ correctAnswers: sql`${gamePlayers.correctAnswers} + 1` })
          .where(eq(gamePlayers.id, playerIdStr));
        console.log('✅ Активное нажатие на совпадение +1 очко (playerId=', playerIdStr, ')');
        statsUpdated = true;
      }
      
      // Ошибка за любое неправильное действие:
      // - playerAnswer=true && isMatch=false (ложное нажатие)
      // - playerAnswer=false && isMatch=true (пропуск совпадения)
      if (!isCorrect) {
        await db
          .update(gamePlayers)
          .set({ errors: sql`${gamePlayers.errors} + 1` })
          .where(eq(gamePlayers.id, playerIdStr));
        console.log('❌ Ошибка (ложное нажатие или пропуск совпадения) +1 (playerId=', playerIdStr, ')');
        statsUpdated = true;
      }
      
      if (!playerAnswer && !isMatch) {
        console.log('⏭️ Правильное бездействие (0 очков, 0 ошибок)');
      }
    } else {
      console.log('⏭️ Пропускаем обновление статистики (ход уже существовал)');
    }

    // Получаем обновлённую статистику
    const player = await db.query.gamePlayers.findFirst({
      where: eq(gamePlayers.id, playerIdStr),
    });

    console.log('📊 Player stats:', player);

    // Проверяем, нужно ли увеличить скорость
    let speedIncreased = false;
    let newSpeedMs = session.currentSpeedMs;
    
    console.log('⚡ Проверка скорости:');
    console.log('  Текущие ошибки игрока:', player?.errors);
    console.log('  player.errors % 3:', player?.errors ? player.errors % 3 : 0);
    console.log('  Текущая скорость:', session.currentSpeedMs);
    
    const playerErrors = player?.errors ?? 0;
    // Увеличиваем скорость если:
    // 1. Ошибок >= 3 (первая проверка на увеличение)
    // 2. Количество ошибок кратно 3 (3, 6, 9, ...)
    // 3. Этот ответ был новым (не дубликат)
    if (player && playerErrors >= 3 && playerErrors % 3 === 0 && moveInserted) {
      newSpeedMs = Math.max(500, Math.floor(session.currentSpeedMs * 0.9));
      
      await db
        .update(gameSessions)
        .set({ currentSpeedMs: newSpeedMs })
        .where(eq(gameSessions.id, sessionIdStr));

      speedIncreased = true;
      console.log('⚡ Скорость увеличена! Новая скорость:', newSpeedMs);
    } else {
      console.log('➡️ Скорость НЕ увеличивается');
      console.log('  Причины:', {
        'player exists': !!player,
        'errors >= 3': playerErrors >= 3,
        'errors % 3 === 0': playerErrors % 3 === 0,
        'moveInserted': moveInserted,
      });
    }

    console.log('✅ Отправляем ответ:', {
      isCorrect,
      isMatch,
      correctAnswers: player?.correctAnswers ?? 0,
      errors: player?.errors ?? 0,
      speedIncreased,
      newSpeedMs: speedIncreased ? newSpeedMs : session.currentSpeedMs,
    });

    return NextResponse.json({
      isCorrect,
      isMatch,
      correctAnswers: player?.correctAnswers ?? 0,
      errors: player?.errors ?? 0,
      speedIncreased,
      newSpeedMs: speedIncreased ? newSpeedMs : session.currentSpeedMs,
    });
  } catch (error) {
    console.error('❌ ERROR при обработке ответа:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
