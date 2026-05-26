import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

export const lobbyRouter = router({
  createLobby: publicProcedure
    .input(z.object({
      gameId: z.string(),
      name: z.string().min(1).max(100),
      nValue: z.number().int().min(1).max(5).default(2),
      baseSpeedMs: z.number().int().min(500).max(5000).default(2000),
      maxPlayers: z.number().int().min(2).max(10).default(4),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lobbyId = uuidv4();
      const now = new Date().toISOString();
      const userId = ctx.user?.id || uuidv4();

      await db.insert(lobbies).values({
        id: lobbyId,
        gameId: input.gameId,
        name: input.name,
        status: 'waiting',
        nValue: input.nValue,
        baseSpeedMs: input.baseSpeedMs,
        minPlayers: 2,
        maxPlayers: input.maxPlayers,
        currentPlayers: 1,
        hostId: userId,
        password: input.password,
        autoStartEnabled: false,
        createdAt: now,
      });

      await db.insert(lobbyPlayers).values({
        id: uuidv4(),
        lobbyId: lobbyId,
        userId: userId,
        name: ctx.user?.name || 'Player',
        isReady: true,
        isHost: true,
        isBot: false,
        joinedAt: now,
      });

      return { lobbyId };
    }),

  joinLobby: publicProcedure
    .input(z.object({
      lobbyId: z.string(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, input.lobbyId),
      });

      if (!lobby) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Лобби не найдено' });
      }

      if (lobby.status !== 'waiting') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Игра уже началась' });
      }

      if (lobby.password && lobby.password !== input.password) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверный пароль' });
      }

      if (lobby.currentPlayers >= lobby.maxPlayers) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Лобби заполнено' });
      }

      const userId = ctx.user?.id || uuidv4();
      const now = new Date().toISOString();

      await db.insert(lobbyPlayers).values({
        id: uuidv4(),
        lobbyId: input.lobbyId,
        userId: userId,
        name: ctx.user?.name || 'Player',
        isReady: false,
        isHost: false,
        isBot: false,
        joinedAt: now,
      });

      await db
        .update(lobbies)
        .set({ currentPlayers: lobby.currentPlayers + 1 })
        .where(eq(lobbies.id, input.lobbyId));

      return { success: true };
    }),

  getLobby: publicProcedure
    .input(z.object({ lobbyId: z.string() }))
    .query(async ({ input }) => {
      const lobby = await db.query.lobbies.findFirst({
        where: eq(lobbies.id, input.lobbyId),
      });

      if (!lobby) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Лобби не найдено' });
      }

      const players = await db.query.lobbyPlayers.findMany({
        where: eq(lobbyPlayers.lobbyId, input.lobbyId),
      });

      return { ...lobby, players };
    }),

  listLobbies: publicProcedure
    .query(async () => {
      const allLobbies = await db.query.lobbies.findMany({
        where: eq(lobbies.status, 'waiting'),
        limit: 50,
      });

      const lobbiesWithPlayers = await Promise.all(
        allLobbies.map(async (lobby) => {
          const players = await db.query.lobbyPlayers.findMany({
            where: eq(lobbyPlayers.lobbyId, lobby.id),
          });
          return { ...lobby, players };
        })
      );

      return lobbiesWithPlayers;
    }),

  setReady: publicProcedure
    .input(z.object({
      lobbyId: z.string(),
      isReady: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await db
        .update(lobbyPlayers)
        .set({ isReady: input.isReady })
        .where(
          and(
            eq(lobbyPlayers.lobbyId, input.lobbyId),
            eq(lobbyPlayers.userId, userId)
          )
        );

      return { success: true };
    }),
});