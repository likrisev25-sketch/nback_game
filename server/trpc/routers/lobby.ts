import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
      try {
        const lobbyId = uuidv4();
        const now = new Date().toISOString();
        // Генерируем временный userId для гостей если не аутентифицирован
        const userId = ctx.user?.id || `guest_${uuidv4()}`;
        const playerName = ctx.user?.name || `Player_${userId.slice(0, 6)}`;

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
          name: playerName,
          isReady: true,
          isHost: true,
          isBot: false,
          joinedAt: now,
        });

        return { lobbyId, success: true };
      } catch (error) {
        console.error('[lobby.createLobby] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось создать лобби. Попробуйте еще раз.',
        });
      }
    }),

  joinLobby: publicProcedure
    .input(z.object({
      lobbyId: z.string(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
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

        // Проверяем текущее количество игроков в БД
        const existingPlayers = await db.query.lobbyPlayers.findMany({
          where: eq(lobbyPlayers.lobbyId, input.lobbyId),
        });

        if (existingPlayers.length >= lobby.maxPlayers) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Лобби заполнено' });
        }

        // Проверяем не в лобби ли уже игрок
        const userId = ctx.user?.id || `guest_${uuidv4()}`;
        const existingPlayer = existingPlayers.find(p => p.userId === userId);
        if (existingPlayer) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Вы уже в этом лобби' });
        }

        const now = new Date().toISOString();
        const playerName = ctx.user?.name || `Player_${userId.slice(0, 6)}`;

        await db.insert(lobbyPlayers).values({
          id: uuidv4(),
          lobbyId: input.lobbyId,
          userId: userId,
          name: playerName,
          isReady: false,
          isHost: false,
          isBot: false,
          joinedAt: now,
        });

        // Обновляем счетчик игроков
        await db
          .update(lobbies)
          .set({ currentPlayers: existingPlayers.length + 1 })
          .where(eq(lobbies.id, input.lobbyId));

        return { success: true, playerId: userId };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[lobby.joinLobby] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось присоединиться к лобби.',
        });
      }
    }),

  getLobby: publicProcedure
    .input(z.object({ lobbyId: z.string() }))
    .query(async ({ input }) => {
      try {
        const lobby = await db.query.lobbies.findFirst({
          where: eq(lobbies.id, input.lobbyId),
        });

        if (!lobby) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Лобби не найдено' });
        }

        const players = await db.query.lobbyPlayers.findMany({
          where: eq(lobbyPlayers.lobbyId, input.lobbyId),
          orderBy: desc(lobbyPlayers.joinedAt),
        });

        return { ...lobby, players };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error('[lobby.getLobby] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Не удалось загрузить лобби.',
        });
      }
    }),

  listLobbies: publicProcedure
    .query(async () => {
      try {
        const allLobbies = await db.query.lobbies.findMany({
          where: eq(lobbies.status, 'waiting'),
          limit: 20, // Ограничиваем количество для производительности
        });

        const lobbiesWithPlayers = await Promise.all(
          allLobbies.map(async (lobby) => {
            const players = await db.query.lobbyPlayers.findMany({
              where: eq(lobbyPlayers.lobbyId, lobby.id),
              limit: lobby.maxPlayers,
            });
            return { 
              ...lobby, 
              players: players.map(p => ({
                id: p.id,
                name: p.name,
                isReady: p.isReady,
                isHost: p.isHost,
                isBot: p.isBot,
              })),
              playerCount: players.length,
            };
          })
        );

        return lobbiesWithPlayers;
      } catch (error) {
        console.error('[lobby.listLobbies] Error:', error);
        return []; // Возвращаем пустой массив вместо ошибки
      }
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