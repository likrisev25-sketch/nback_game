import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences, gameMoves } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

function generateNBackSequence(totalSteps: number, nValue: number, gridSize: number = 9): number[] {
  const positions: number[] = [];
  
  for (let i = 0; i < totalSteps; i++) {
    let position: number;
    
    if (i >= nValue && Math.random() < 0.3) {
      position = positions[i - nValue];
    } else {
      position = Math.floor(Math.random() * gridSize);
    }
    
    positions.push(position);
  }
  
  return positions;
}

function checkNBackAnswer(
  stepNumber: number,
  sequence: number[],
  playerAnswer: boolean,
  nValue: number
): { isCorrect: boolean; isMatch: boolean } {
  const isMatch = stepNumber >= nValue && sequence[stepNumber] === sequence[stepNumber - nValue];
  const isCorrect = playerAnswer === isMatch;
  
  return { isCorrect, isMatch };
}

export const gameSimpleRouter = router({
  createSession: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      playerName: z.string().min(1).max(50).optional(),
      nValue: z.number().int().min(1).max(5).default(2),
      totalSteps: z.number().int().min(10).max(100).default(30),
      baseSpeedMs: z.number().int().min(500).max(5000).default(1500),
    }))
    .mutation(async ({ input }) => {
      console.log('🔵 [gameSimple.createSession] Received input:', JSON.stringify(input));
      
      try {
        const sessionId = uuidv4();
        const now = new Date().toISOString();
        const playerId = uuidv4();

        console.log('🔵 [gameSimple.createSession] Creating session:', sessionId);

        await db.insert(gameSessions).values({
          id: sessionId,
          name: input.name,
          nValue: input.nValue,
          baseSpeedMs: input.baseSpeedMs,
          currentSpeedMs: input.baseSpeedMs,
          maxPlayers: 2,
          status: 'waiting',
          createdAt: now,
          updatedAt: now,
        });

        console.log('🔵 [gameSimple.createSession] Session created');

        const playerName = input.playerName || 'Player';
        await db.insert(gamePlayers).values({
          id: playerId,
          sessionId: sessionId,
          userId: playerId,
          name: playerName,
          correctAnswers: 0,
          errors: 0,
          isBot: false,
          botAccuracy: 100,
          isHost: true,
          joinedAt: now,
        });

        console.log('🔵 [gameSimple.createSession] Player created:', playerName);

        const result = {
          sessionId,
          playerId,
          name: input.name,
          nValue: input.nValue,
        };
        
        console.log('✅ [gameSimple.createSession] Returning:', JSON.stringify(result));
        return result;
      } catch (error) {
        console.error('❌ [gameSimple.createSession] Error:', error);
        throw error;
      }
    }),

  joinSession: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      playerName: z.string().min(1).max(50).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('🔵 [gameSimple.joinSession] Join request for sessionId:', input.sessionId);
      
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        console.error('❌ [gameSimple.joinSession] Session not found:', input.sessionId);
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Сессия не найдена' });
      }

      if (session.status !== 'waiting') {
        console.error('❌ [gameSimple.joinSession] Session status:', session.status);
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Игра уже началась' });
      }

      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, input.sessionId),
      });

      console.log('🔵 [gameSimple.joinSession] Current players count:', players.length);

      if (players.length >= session.maxPlayers) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Лобби заполнено' });
      }

      const now = new Date().toISOString();
      const playerId = uuidv4();

      await db.insert(gamePlayers).values({
        id: playerId,
        sessionId: input.sessionId,
        userId: playerId,
        name: input.playerName || 'Player',
        correctAnswers: 0,
        errors: 0,
        isBot: false,
        botAccuracy: 100,
        isHost: false,
        joinedAt: now,
      });

      console.log('✅ [gameSimple.joinSession] Player joined:', { playerId });
      return { playerId };
    }),

  getSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Сессия не найдена' });
      }

      const players = await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, input.sessionId),
      });

      return {
        id: session.id,
        name: session.name,
        nValue: session.nValue,
        status: session.status,
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          isHost: p.isHost,
        })),
      };
    }),

  listSessions: publicProcedure
    .query(async () => {
      const sessions = await db.query.gameSessions.findMany({
        where: eq(gameSessions.status, 'waiting'),
        limit: 20,
      });

      const sessionsWithPlayers = await Promise.all(
        sessions.map(async (session) => {
          const players = await db.query.gamePlayers.findMany({
            where: eq(gamePlayers.sessionId, session.id),
          });
          return {
            id: session.id,
            name: session.name,
            players: players.map(p => ({ id: p.id, name: p.name })),
          };
        })
      );

      return sessionsWithPlayers;
    }),

  startGame: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const session = await db.query.gameSessions.findFirst({
        where: eq(gameSessions.id, input.sessionId),
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Сессия не найдена' });
      }

      if (session.status !== 'waiting') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Игра уже началась' });
      }

      const totalSteps = 30;
      const positions = generateNBackSequence(totalSteps, session.nValue);
      const now = new Date().toISOString();

      await db.insert(sequences).values({
        id: uuidv4(),
        sessionId: input.sessionId,
        positions: JSON.stringify(positions),
        totalSteps,
        createdAt: now,
      });

      await db
        .update(gameSessions)
        .set({
          status: 'playing',
          updatedAt: now,
        })
        .where(eq(gameSessions.id, input.sessionId));

      return { success: true };
    }),
});