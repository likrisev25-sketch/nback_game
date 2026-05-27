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
    if (!sessionIdStr || !isValidUUID(sessionIdStr)) {
      console.error('❌ Некорректный sessionId:', sessionIdStr);
      return NextResponse.json(
        { error: 'Некорректный ID сессии' },
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

    const positions = JSON.parse(sequenceData.positions) as number[];
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

    // Получаем всех игроков для поиска бота
    const players = await db.query.gamePlayers.findMany({
      where: eq(gamePlayers.sessionId, sessionIdStr),
    });

    const bot = players.find(p => p.isBot);
    console.log('🔍 Bot found:', bot ? 'YES' : 'NO');

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
    let statsUpdated = false;
    if (moveInserted) {
      console.log('📊 Обновляем статистику игрока...');
      if (isCorrect) {
        await db
          .update(gamePlayers)
          .set({ correctAnswers: sql`${gamePlayers.correctAnswers} + 1` })
          .where(eq(gamePlayers.id, playerIdStr));
        console.log('✅ Правильный ответ +1');
        statsUpdated = true;
      } else {
        await db
          .update(gamePlayers)
          .set({ errors: sql`${gamePlayers.errors} + 1` })
          .where(eq(gamePlayers.id, playerIdStr));
        console.log('❌ Ошибка +1');
        statsUpdated = true;
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
    if (player && playerErrors > 0 && playerErrors % 3 === 0 && statsUpdated) {
      newSpeedMs = Math.max(500, Math.floor(session.currentSpeedMs * 0.9));
      
      await db
        .update(gameSessions)
        .set({ currentSpeedMs: newSpeedMs })
        .where(eq(gameSessions.id, sessionIdStr));

      speedIncreased = true;
      console.log('⚡ Скорость увеличена! Новая скорость:', newSpeedMs);
    } else {
      console.log('➡️ Скорость НЕ увеличивается');
    }

    console.log('✅ Отправляем ответ:', {
      isCorrect,
      isMatch,
      correctAnswers: player?.correctAnswers ?? 0,
      errors: player?.errors ?? 0,
      speedIncreased,
      newSpeedMs: speedIncreased ? newSpeedMs : session.currentSpeedMs,
    });

    // Даем боту ответить на этом же шаге
    // Бот действует по правилам: отвечает только когда есть реальное совпадение или его нет
    // botAccuracy определяет вероятность правильного ответа
    if (bot) {
      console.log('🤖 Запускаем ответ бота для шага', stepNumber);
      
      // Проверяем, не отвечал ли бот уже на этот шаг
      const existingBotMove = await db.query.gameMoves.findFirst({
        where: (moves, { and, eq }) => and(
          eq(moves.sessionId, sessionIdStr),
          eq(moves.playerId, bot.id),
          eq(moves.stepNumber, stepNumber)
        ),
      });

      if (existingBotMove) {
        console.log('⛔ Бот уже отвечал на шаг', stepNumber);
      } else {
        // Вычисляем реальное совпадение
        let realIsMatch = false;
        if (stepNumber >= nValue) {
          realIsMatch = positions[stepNumber] === positions[stepNumber - nValue];
        }
        
        // Бот принимает решение на основе botAccuracy
        // botAccuracy = вероятность что бот ответит ПРАВИЛЬНО (не просто нажмет кнопку)
        const random = Math.random() * 100;
        const shouldAnswerCorrectly = random < (bot.botAccuracy || 80);
        
        // Если бот должен ответить правильно:
        //   - при realIsMatch=true -> нажимает кнопку (true)
        //   - при realIsMatch=false -> не нажимает (false)
        // Если бот должен ошибиться:
        //   - при realIsMatch=true -> не нажимает (false) - ошибка
        //   - при realIsMatch=false -> нажимает (true) - ошибка
        const botAnswer = shouldAnswerCorrectly ? realIsMatch : !realIsMatch;
        
        console.log('🤖 Бот: realIsMatch=', realIsMatch, '| shouldAnswerCorrectly=', shouldAnswerCorrectly, '| botAnswer=', botAnswer);
        
        // Проверяем ответ бота
        const { isCorrect: botIsCorrect } = checkNBackAnswer(
          position,
          stepNumber,
          positions,
          botAnswer,
          nValue
        );
        
        console.log('🤖 Ответ бота правильный:', botIsCorrect);
          
        // Сохраняем ход бота
        const now = new Date().toISOString();
        const insertedBotMoves = await db.insert(gameMoves).values({
          id: uuidv4(),
          sessionId: sessionIdStr,
          playerId: bot.id,
          position,
          stepNumber,
          isMatch,
          playerAnswer: botAnswer,
          isCorrect: botIsCorrect,
          createdAt: now,
        }).onConflictDoNothing().returning();

        const botMoveInserted = insertedBotMoves.length > 0;
        console.log(botMoveInserted ? '✅ Ход бота сохранён' : '⛔ Ход бота уже существует (конфликт)');
        
        // Обновляем статистику бота ТОЛЬКО если ход был вставлен впервые
        // Очки начисляются только за правильные ответы
        if (botMoveInserted) {
          if (botIsCorrect) {
            await db
              .update(gamePlayers)
              .set({ correctAnswers: sql`${gamePlayers.correctAnswers} + 1` })
              .where(eq(gamePlayers.id, bot.id));
            console.log('🤖 Бот получил +1 очко (правильный ответ)');
          } else {
            await db
              .update(gamePlayers)
              .set({ errors: sql`${gamePlayers.errors} + 1` })
              .where(eq(gamePlayers.id, bot.id));
            console.log('🤖 Бот получил ошибку (неправильный ответ)');
          }
        } else {
          console.log('⏭️ Пропускаем обновление статистики бота (ход уже существовал)');
        }
      }
    }

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
