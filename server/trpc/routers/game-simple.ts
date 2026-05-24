import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getUserName } from '@/lib/auth-simple';

export const gameRouter = router({
  // Создание сессии
  createSession: publicProcedure
    .input(z.object({
      name: z.string(),
      nValue: z.number().min(1).max(5),
      totalSteps: z.number().min(10).max(100),
      baseSpeedMs: z.number().min(500).max(5000),
    }))
    .mutation(async ({ input }) => {
      const sessionId = nanoid();
      const userId = 'user_' + nanoid();
      const playerName = getUserName();
      
      const now = new Date().toISOString();
      
      await db.insert(gameSessions).values({
        id: sessionId,
        name: input.name || 'Без названия',
        nValue: input.nValue,
        baseSpeedMs: input.baseSpeedMs,
        currentSpeedMs: input.baseSpeedMs,
        maxPlayers: 4,
        status: 'waiting',
        createdAt: now,
        updatedAt: now,
      });
      
      // Добавляем создателя как первого игрока
      await db.insert(gamePlayers).values({
        id: nanoid(),
        sessionId: sessionId,
        userId: userId,
        name: playerName,
        correctAnswers: 0,
        errors: 0,
        isBot: false,
        botAccuracy: 100,
        isHost: true,
        joinedAt: now,
      });
      
      return { sessionId, name: input.name };
    }),
  
  // Присоединение к сессии
  joinSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId)
      });
      
      if (!session) throw new Error('Session not found');
      if (session.status !== 'waiting') throw new Error('Game already started');
      
      const userId = 'user_' + nanoid();
      const playerName = getUserName();
      const now = new Date().toISOString();
      
      // Проверяем, не присоединился ли уже этот игрок
      const existingPlayer = await db.query.gamePlayers.findFirst({
        where: and(
          eq(gamePlayers.sessionId, input.sessionId),
          eq(gamePlayers.name, playerName)
        )
      });
      
      if (!existingPlayer) {
        await db.insert(gamePlayers).values({
          id: nanoid(),
          sessionId: input.sessionId,
          userId: userId,
          name: playerName,
          correctAnswers: 0,
          errors: 0,
          isBot: false,
          botAccuracy: 100,
          isHost: false,
          joinedAt: now,
        });
      }
      
      return { success: true };
    }),
  
  // Получить данные сессии
  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
        with: {
          players: true
        }
      });
      return session;
    }),
  
  // Получить список сессий
  listSessions: publicProcedure
    .query(async () => {
      const sessions = await db.query.gameSessions.findMany({
        where: eq(gameSessions.status, 'waiting'),
        with: {
          players: true
        },
        orderBy: desc(gameSessions.createdAt)
      });
      return sessions;
    }),
  
  // Начать игру
  startGame: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      await db.update(gameSessions)
        .set({ status: 'playing', updatedAt: new Date().toISOString() })
        .where(eq(gameSessions.id, input.sessionId));
      return { success: true };
    })
});
