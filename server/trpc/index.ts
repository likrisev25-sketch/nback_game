import { router } from './trpc';
import { gameRouter } from './routers/game';

// Главный роутер, объединяющий все роуты приложения
export const appRouter = router({
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
