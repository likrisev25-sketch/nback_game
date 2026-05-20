import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences, gameMoves } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Генерация случайной последовательности N-back на сервере
export function generateNBackSequence(totalSteps: number, gridSize: number = 9): number[] {
  const positions: number[] = [];
  
  for (let i = 0; i < totalSteps; i++) {
    // С вероятностью 30% повторяем позицию из N шагов назад (для N=3)
    if (i >= 3 && Math.random() < 0.3) {
      positions.push(positions[i - 3]);
    } else {
      // Иначе случайная позиция
      positions.push(Math.floor(Math.random() * gridSize));
    }
  }
  
  return positions;
}

// Проверка ответа игрока
export function checkNBackAnswer(
  position: number,
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): { isCorrect: boolean; isMatch: boolean } {
  const isMatch = stepNumber >= nValue && sequence[stepNumber] === sequence[stepNumber - nValue];
  const isCorrect = playerAnswer === isMatch;
  
  return { isCorrect, isMatch };
}

// Логика увеличения скорости
export function speedIncreaseLogic(currentSpeedMs: number, errors: number): number | null {
  if (errors > 0 && errors % 3 === 0) {
    return Math.max(500, Math.floor(currentSpeedMs * 0.9));
  }
  return null;
}

export const gameRouter = router({
  // Создание новой игровой сессии
  createSession: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      nValue: z.number().int().min(1).max(5).default(3),
      totalSteps: z.number().int().min(10).max(100).default(30),
      baseSpeedMs: z.number().int().min(500).max(5000).default(2000),
    }))
    .mutation(async ({ input }) => {
      const sessionId = uuidv4();
      const now = new Date().toISOString();

      // Генерируем последовательность на сервере
      const positions = generateNBackSequence(input.totalSteps);

      // Создаём сессию
      const [session] = await db
        .insert(gameSessions)
        .values({
          id: sessionId,
          name: input.name,
          nValue: input.nValue,
          baseSpeedMs: input.baseSpeedMs,
          currentSpeedMs: input.baseSpeedMs,
          status: 'waiting',
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Сохраняем последовательность
      await db.insert(sequences).values({
        id: uuidv4(),
        sessionId: sessionId,
        positions: JSON.stringify(positions),
        totalSteps: input.totalSteps,
        createdAt: now,
      });

      // Добавляем создателя как игрока (без userId - только для внутреннего использования)
      await db.insert(gamePlayers).values({
        id: uuidv4(),
        sessionId: sessionId,
        userId: sessionId, // Используем sessionId как временный userId
        correctAnswers: 0,
        errors: 0,
        isBot: false,
        botAccuracy: 100,
        joinedAt: now,
      });

      return {
        sessionId: session.id,
        name: session.name,
        nValue: session.nValue,
        baseSpeedMs: session.baseSpeedMs,
        status: session.status,
      };
    }),

  // Присоединение к сессии
  joinSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Сессия не найдена',
        });
      }

      if (session.status !== 'waiting') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Игра уже началась',
        });
      }

      const now = new Date().toISOString();
      const [player] = await db
        .insert(gamePlayers)
        .values({
          id: uuidv4(),
          sessionId: input.sessionId,
          userId: uuidv4(), // Генерируем временный userId
          correctAnswers: 0,
          errors: 0,
          isBot: false,
          botAccuracy: 100,
          joinedAt: now,
        })
        .returning();

      return { alreadyJoined: false, playerId: player.id };
    }),

  // Добавление бота в сессию
  addBot: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      botAccuracy: z.number().int().min(50).max(100).default(90),
    }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Сессия не найдена',
        });
      }

      if (session.status !== 'waiting') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Игра уже началась',
        });
      }

      const now = new Date().toISOString();
      const [bot] = await db
        .insert(gamePlayers)
        .values({
          id: uuidv4(),
          sessionId: input.sessionId,
          userId: uuidv4(), // Генерируем временный userId
          correctAnswers: 0,
          errors: 0,
          isBot: true,
          botAccuracy: input.botAccuracy,
          joinedAt: now,
        })
        .returning();

      return { botId: bot.id };
    }),

  // Начало игры
  startGame: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Сессия не найдена',
        });
      }

      // Проверяем количество игроков (минимум 1 для одиночной игры)
      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, input.sessionId),
      });

      if (players.length < 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Нужен минимум 1 игрок для начала игры',
        });
      }

      const now = new Date().toISOString();
      await db
        .update(gameSessions)
        .set({
          status: 'playing',
          updatedAt: now,
        })
        .where(eq(gameSessions.id, input.sessionId));

      return { success: true };
    }),

  // Отправка ответа игрока
  submitAnswer: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerId: z.string(),
      position: z.number().int().min(0).max(8),
      stepNumber: z.number().int().min(0),
      playerAnswer: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session || session.status !== 'playing') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Игра не активна',
        });
      }

      // Получаем последовательность
      const sequenceData = await db.query.sequences.findFirst({
        where: eq(sequences.sessionId, input.sessionId),
      });

      if (!sequenceData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Последовательность не найдена',
        });
      }

      const positions = JSON.parse(String(sequenceData.positions)) as number[];
      const nValue = session.nValue;

      // Проверяем ответ
      const { isCorrect, isMatch } = checkNBackAnswer(
        input.position,
        input.stepNumber,
        positions,
        input.playerAnswer,
        nValue
      );

      const now = new Date().toISOString();

      // Сохраняем ход
      await db.insert(gameMoves).values({
        id: uuidv4(),
        sessionId: input.sessionId,
        playerId: input.playerId,
        position: input.position,
        stepNumber: input.stepNumber,
        isMatch: isMatch,
        playerAnswer: input.playerAnswer,
        isCorrect: isCorrect,
        createdAt: now,
      });

      // Обновляем статистику игрока
      if (isCorrect) {
        await db
          .update(gamePlayers)
          .set({
            correctAnswers: sql`${gamePlayers.correctAnswers} + 1`,
          })
          .where(eq(gamePlayers.id, input.playerId));
      } else {
        await db
          .update(gamePlayers)
          .set({
            errors: sql`${gamePlayers.errors} + 1`,
          })
          .where(eq(gamePlayers.id, input.playerId));
      }

      // Проверяем, нужно ли увеличить скорость (каждые 3 ошибки у любого игрока)
      const player = await db.query.gamePlayers.findFirst({
        where: eq(gamePlayers.id, input.playerId),
      });

      let speedIncreased = false;
      let newSpeedMs = session.currentSpeedMs;
      const increasedSpeed = speedIncreaseLogic(session.currentSpeedMs, player?.errors || 0);
      if (increasedSpeed !== null) {
        newSpeedMs = increasedSpeed;
        
        await db
          .update(gameSessions)
          .set({
            currentSpeedMs: newSpeedMs,
            updatedAt: now,
          })
          .where(eq(gameSessions.id, input.sessionId));

        speedIncreased = true;
      }

      return {
        isCorrect,
        isMatch,
        correctAnswers: player?.correctAnswers || 0,
        errors: player?.errors || 0,
        speedIncreased,
        newSpeedMs: speedIncreased ? newSpeedMs : session.currentSpeedMs,
      };
    }),

  // Получение статистики сессии
  getSessionStats: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .query(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Сессия не найдена',
        });
      }

      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, input.sessionId),
        orderBy: (players: typeof gamePlayers, { desc }: any) => [desc(players.correctAnswers)],
      });

      return {
        session: {
          id: session.id,
          name: session.name,
          nValue: session.nValue,
          currentSpeedMs: session.currentSpeedMs,
          status: session.status,
        },
        players: players.map((p: typeof gamePlayers.$inferSelect) => ({
          id: p.id,
          correctAnswers: p.correctAnswers,
          errors: p.errors,
          isBot: p.isBot,
        })),
      };
    }),

  // Завершение игры и определение победителя
  finishGame: publicProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Сессия не найдена',
        });
      }

      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, input.sessionId),
        orderBy: (players: typeof gamePlayers, { desc }: any) => [desc(players.correctAnswers)],
      });

      const winner = players[0];

      const now = new Date().toISOString();
      await db
        .update(gameSessions)
        .set({
          status: 'finished',
          updatedAt: now,
        })
        .where(eq(gameSessions.id, input.sessionId));

      return {
        winner: winner ? {
          id: winner.id,
          correctAnswers: winner.correctAnswers,
          errors: winner.errors,
          isBot: winner.isBot,
        } : null,
        players: players.map((p: typeof gamePlayers.$inferSelect) => ({
          id: p.id,
          correctAnswers: p.correctAnswers,
          errors: p.errors,
          isBot: p.isBot,
        })),
      };
    }),
});

export type GameRouter = typeof gameRouter;
