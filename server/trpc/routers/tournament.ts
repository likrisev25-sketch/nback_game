import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/db/db';
import { tournaments, tournamentPlayers, tournamentResults } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';

export const tournamentRouter = router({
  createTournament: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      nValue: z.number().int().min(1).max(5).default(2),
      totalSteps: z.number().int().min(10).max(100).default(30),
      baseSpeedMs: z.number().int().min(500).max(5000).default(2000),
      maxRounds: z.number().int().min(1).max(10).default(5),
      maxPlayers: z.number().int().min(2).max(16).default(8),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const tournamentId = uuidv4();
      const now = new Date().toISOString();
      const userId = ctx.user?.id || uuidv4();

      await db.insert(tournaments).values({
        id: tournamentId,
        name: input.name,
        nValue: input.nValue,
        totalSteps: input.totalSteps,
        baseSpeedMs: input.baseSpeedMs,
        maxRounds: input.maxRounds,
        currentRound: 1,
        status: 'waiting',
        minPlayers: 2,
        maxPlayers: input.maxPlayers,
        currentPlayers: 1,
        hostId: userId,
        password: input.password,
        createdAt: now,
      });

      await db.insert(tournamentPlayers).values({
        id: uuidv4(),
        tournamentId: tournamentId,
        userId: userId,
        name: ctx.user?.name || 'Player',
        isReady: true,
        isHost: true,
        joinedAt: now,
      });

      return { tournamentId };
    }),

  joinTournament: publicProcedure
    .input(z.object({
      tournamentId: z.string(),
      password: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.tournamentId),
      });

      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Турнир не найден' });
      }

      if (tournament.status !== 'waiting') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Турнир уже начался' });
      }

      if (tournament.password && tournament.password !== input.password) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Неверный пароль' });
      }

      if (tournament.currentPlayers >= tournament.maxPlayers) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Турнир заполнен' });
      }

      const userId = ctx.user?.id || uuidv4();
      const now = new Date().toISOString();

      await db.insert(tournamentPlayers).values({
        id: uuidv4(),
        tournamentId: input.tournamentId,
        userId: userId,
        name: ctx.user?.name || 'Player',
        isReady: false,
        isHost: false,
        joinedAt: now,
      });

      await db
        .update(tournaments)
        .set({ currentPlayers: tournament.currentPlayers + 1 })
        .where(eq(tournaments.id, input.tournamentId));

      return { success: true };
    }),

  getTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .query(async ({ input }) => {
      const tournament = await db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.tournamentId),
      });

      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Турнир не найден' });
      }

      const players = await db.query.tournamentPlayers.findMany({
        where: eq(tournamentPlayers.tournamentId, input.tournamentId),
      });

      const results = await db.query.tournamentResults.findMany({
        where: eq(tournamentResults.tournamentId, input.tournamentId),
      });

      return { ...tournament, players, results };
    }),

  listTournaments: publicProcedure
    .query(async () => {
      const allTournaments = await db.query.tournaments.findMany({
        where: eq(tournaments.status, 'waiting'),
        limit: 50,
      });

      const tournamentsWithPlayers = await Promise.all(
        allTournaments.map(async (tournament) => {
          const players = await db.query.tournamentPlayers.findMany({
            where: eq(tournamentPlayers.tournamentId, tournament.id),
          });
          return { ...tournament, players };
        })
      );

      return tournamentsWithPlayers;
    }),

  startTournament: publicProcedure
    .input(z.object({ tournamentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tournament = await db.query.tournaments.findFirst({
        where: eq(tournaments.id, input.tournamentId),
      });

      if (!tournament) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Турнир не найден' });
      }

      if (tournament.hostId !== (ctx.user?.id || ctx.user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Только хост может начать турнир' });
      }

      if (tournament.currentPlayers < tournament.minPlayers) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Недостаточно игроков' });
      }

      const now = new Date().toISOString();
      await db
        .update(tournaments)
        .set({
          status: 'playing',
          startedAt: now,
        })
        .where(eq(tournaments.id, input.tournamentId));

      return { success: true };
    }),
});