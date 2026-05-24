import { router } from './trpc';
import { gameRouter } from './routers/game';
import { gameRouter as gameSimpleRouter } from './routers/game-simple';

// Главный роутер, объединяющий все роуты приложения
export const appRouter = router({
  game: gameRouter,
  gameSimple: gameSimpleRouter,
});

export type AppRouter = typeof appRouter;
