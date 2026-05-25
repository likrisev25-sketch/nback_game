import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { getUserName } from '@/lib/auth-simple';

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

export const gameRouter = router({
  // Создание сессии
  createSession: publicProcedure
    .input(z.object({
      name: z.string(),
      nValue: z.number().min(1).max(5),
      totalSteps: z.number().min(10).max(100),
      baseSpeedMs: z.number().min(500).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('🔵 [gameSimple.createSession] Creating session with input:', input);
      const sessionId = nanoid();
      const playerId = nanoid();
      const userId = 'user_' + nanoid();
      const playerName = getUserName();
      
      console.log('🔵 [gameSimple.createSession] Generated sessionId:', sessionId, 'playerId:', playerId, 'playerName:', playerName);
      
      const now = new Date().toISOString();
      
      try {
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
        
        console.log('✅ [gameSimple.createSession] Session inserted');
        
        // Добавляем создателя как первого игрока
        await db.insert(gamePlayers).values({
          id: playerId,
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
        
        console.log('✅ [gameSimple.createSession] Player inserted with playerId:', playerId);
        
        return { sessionId, playerId, name: input.name };
      } catch (error) {
        console.error('❌ [gameSimple.createSession] Error:', error);
        throw error;
      }
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
      
      const playerName = getUserName();
      const now = new Date().toISOString();
      
      // Проверяем, не присоединился ли уже этот игрок
      const existingPlayer = await db.query.gamePlayers.findFirst({
        where: and(
          eq(gamePlayers.sessionId, input.sessionId),
          eq(gamePlayers.name, playerName)
        )
      });
      
      if (existingPlayer) {
        return { success: true, playerId: existingPlayer.id };
      }
      
      const playerId = nanoid();
      const userId = 'user_' + nanoid();
      
      await db.insert(gamePlayers).values({
        id: playerId,
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
      
      return { success: true, playerId };
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
    .query(async ({ ctx }) => {
      console.log('🔵 [gameSimple.listSessions] Query started');
      try {
        const sessions = await db.query.gameSessions.findMany({
          where: eq(gameSessions.status, 'waiting'),
          with: {
            players: true
          },
          orderBy: desc(gameSessions.createdAt)
        });
        console.log('📊 [gameSimple.listSessions] Found sessions:', sessions?.length || 0);
        return sessions;
      } catch (error) {
        console.error('❌ [gameSimple.listSessions] Error:', error);
        throw error;
      }
    }),
  
  // Начать игру
  startGame: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId)
      });
      
      if (!session) throw new Error('Session not found');
      if (session.status !== 'waiting') {
        return { success: true, alreadyPlaying: true };
      }
      
      // Генерируем последовательность
      const totalSteps = 30;
      const positions = generateNBackSequence(totalSteps, session.nValue);
      
      const now = new Date().toISOString();
      
      // Сохраняем последовательность
      await db.insert(sequences).values({
        id: uuidv4(),
        sessionId: input.sessionId,
        positions: JSON.stringify(positions),
        totalSteps,
        createdAt: now,
      });
      
      // Обновляем статус сессии
      await db.update(gameSessions)
        .set({ 
          status: 'playing', 
          updatedAt: new Date().toISOString() 
        })
        .where(eq(gameSessions.id, input.sessionId));
      
      return { success: true, alreadyPlaying: false };
    })
});
