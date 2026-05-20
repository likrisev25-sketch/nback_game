import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, sequences, gamePlayers, gameMoves } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

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
    
    if (!sessionIdStr || !isValidGameId(sessionIdStr)) {
      return NextResponse.json(
        { error: 'Некорректный ID игры' },
        { status: 400 }
      );
    }

    const body = await request.json() as { stepNumber: number };
    const stepNumber = Number(body.stepNumber);

    if (typeof stepNumber !== 'number' || stepNumber < 0) {
      return NextResponse.json(
        { error: 'Номер шага должен быть неотрицательным' },
        { status: 400 }
      );
    }

    console.log('🤖 [bot-move] Шаг', stepNumber, 'сессия', sessionIdStr);

    // Проверяем сессию
    const session = await db.query.gameSessions.findFirst({
      where: eq(gameSessions.id, sessionIdStr),
    });

    if (!session || session.status !== 'playing') {
      return NextResponse.json(
        { error: 'Игра не активна' },
        { status: 400 }
      );
    }

    // Получаем последовательность
    const sequenceData = await db.query.sequences.findFirst({
      where: eq(sequences.sessionId, sessionIdStr),
    });

    if (!sequenceData) {
      return NextResponse.json(
        { error: 'Последовательность не найдена' },
        { status: 404 }
      );
    }

    const positions = JSON.parse(String(sequenceData.positions)) as number[];
    const nValue = session.nValue;

    // Находим бота
    const bot = await db.query.gamePlayers.findFirst({
      where: (players: typeof gamePlayers, { and, eq }: any) => and(
        eq(players.sessionId, sessionIdStr),
        eq(players.isBot, true)
      ),
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Бот не найден' },
        { status: 404 }
      );
    }

    // Проверяем, не отвечал ли бот уже на этот шаг
    const existingBotMove = await db.query.gameMoves.findFirst({
      where: (moves, { and, eq }) => and(
        eq(moves.sessionId, sessionIdStr),
        eq(moves.playerId, bot.id),
        eq(moves.stepNumber, stepNumber)
      ),
    });

    if (existingBotMove) {
      console.log('⛔ [bot-move] Бот уже отвечал на шаг', stepNumber);
      return NextResponse.json({
        success: true,
        botAnswer: existingBotMove.playerAnswer,
        isCorrect: existingBotMove.isCorrect,
        isMatch: existingBotMove.isMatch,
        duplicate: true,
      });
    }

    // ===== БОТ ПРИНИМАЕТ РЕШЕНИЕ =====
    
    // Вычисляем РЕАЛЬНОЕ совпадение для бота
    let botRealIsMatch = false;
    if (stepNumber >= nValue) {
      botRealIsMatch = positions[stepNumber] === positions[stepNumber - nValue];
    }
    
    console.log('🤖 [bot-move] Бот вычисляет:');
    console.log('  stepNumber:', stepNumber);
    console.log('  positions[', stepNumber, ']:', positions[stepNumber]);
    if (stepNumber >= nValue) {
      console.log('  positions[', stepNumber - nValue, ']:', positions[stepNumber - nValue]);
    }
    console.log('  botRealIsMatch (реальное совпадение):', botRealIsMatch);
    
    // Бот принимает решение на основе botAccuracy
    // botAccuracy - это процент правильных ответов
    const random = Math.random() * 100;
    const shouldAnswerCorrectly = random < (bot.botAccuracy || 80);
    
    console.log('🤖 [bot-move] Рандом:', random.toFixed(2), '| Accuracy:', bot.botAccuracy, '| Should be correct:', shouldAnswerCorrectly);
    
    // Если бот должен ответить правильно:
    //   - при botRealIsMatch=true -> нажимает кнопку (true)
    //   - при botRealIsMatch=false -> НЕ нажимает (false)
    // Если бот должен ошибиться:
    //   - при botRealIsMatch=true -> НЕ нажимает (false) - это ошибка (пропуск)
    //   - при botRealIsMatch=false -> нажимает (true) - это ошибка (ложное нажатие)
    const botAnswer = shouldAnswerCorrectly ? botRealIsMatch : !botRealIsMatch;
    
    // Проверяем правильный ли ответ
    const botIsCorrect = botAnswer === botRealIsMatch;
    
    console.log('🤖 [bot-move] РЕШЕНИЕ: botAnswer=', botAnswer, '| botIsCorrect=', botIsCorrect);
    
    // Сохраняем ход бота
    const now = new Date().toISOString();
    const insertedBotMoves = await db.insert(gameMoves).values({
      id: uuidv4(),
      sessionId: sessionIdStr,
      playerId: bot.id,
      position: positions[stepNumber],
      stepNumber,
      isMatch: botRealIsMatch,
      playerAnswer: botAnswer,
      isCorrect: botIsCorrect,
      createdAt: now,
    }).onConflictDoNothing().returning();

    const botMoveInserted = insertedBotMoves.length > 0;
    console.log(botMoveInserted ? '✅ [bot-move] Ход бота сохранён' : '⛔ [bot-move] Ход бота уже существует');
    
    // Обновляем статистику бота ТОЛЬКО если ход был вставлен впервые
    if (botMoveInserted) {
      console.log('🤖 [bot-move] Обновляем статистику бота:');
      console.log('  bot.id:', bot.id);
      console.log('  botAnswer:', botAnswer, '| botIsCorrect:', botIsCorrect, '| botRealIsMatch:', botRealIsMatch);
      
      // ПРОСТАЯ ЛОГИКА:
      // +1 ОЧКО: Бот правильно нажал на совпадение
      //   (botAnswer=true И botRealIsMatch=true)
      if (botAnswer === true && botRealIsMatch === true) {
        await db
          .update(gamePlayers)
          .set({ correctAnswers: sql`${gamePlayers.correctAnswers} + 1` })
          .where(eq(gamePlayers.id, bot.id));
        console.log('✅ [bot-move] +1 ОЧКО (правильно нажал на совпадение)');
      }
      
      // +1 ОШИБКА: Бот неправильно ответил
      //   (botAnswer=true И botRealIsMatch=false) - ложное нажатие
      //   ИЛИ (botAnswer=false И botRealIsMatch=true) - пропуск совпадения
      if (botAnswer !== botRealIsMatch) {
        await db
          .update(gamePlayers)
          .set({ errors: sql`${gamePlayers.errors} + 1` })
          .where(eq(gamePlayers.id, bot.id));
        console.log('❌ [bot-move] +1 ОШИБКА (неправильный ответ)');
      }
      
      // Правильное бездействие (не нажал когда нет совпадения) - ничего не делаем
      if (botAnswer === false && botRealIsMatch === false) {
        console.log('⏭️ [bot-move] Правильное бездействие (0/0)');
      }
    }
      
    // Получаем обновлённую статистику бота
    const botStats = await db.query.gamePlayers.findFirst({
      where: eq(gamePlayers.id, bot.id),
    });

    return NextResponse.json({
      success: true,
      botAnswer,
      isCorrect: botIsCorrect,
      isMatch: botRealIsMatch,
      correctAnswers: botStats?.correctAnswers ?? 0,
      errors: botStats?.errors ?? 0,
      duplicate: !botMoveInserted,
    });

  } catch (error) {
    console.error('❌ [bot-move] Ошибка:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
