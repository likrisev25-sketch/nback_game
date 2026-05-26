import { router } from './trpc';
import { gameSimpleRouter } from './routers/game-simple';
import { lobbyRouter } from './routers/lobby';
import { tournamentRouter } from './routers/tournament';

export const appRouter = router({
  gameSimple: gameSimpleRouter,
  lobby: lobbyRouter,
  tournament: tournamentRouter,
});

export type AppRouter = typeof appRouter;