import { initTRPC } from '@trpc/server';
import { Context } from './context';

// Создаём инициализированный экземпляр tRPC
const t = initTRPC.context<Context>().create();

// Экспортируем базовые объекты
export const router = t.router;
export const publicProcedure = t.procedure;

// Защищённая процедура - требует авторизации (пока не используется)
export const protectedProcedure = t.procedure.use(
  t.middleware(async opts => {
    return opts.next({ ctx: opts.ctx });
  }),
);
