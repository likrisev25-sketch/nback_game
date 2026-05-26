import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getSessionFromRequest } from '@/lib/session';

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  try {
    const session = await getSessionFromRequest(opts.req as any);
    return {
      session,
      user: session?.user || null,
    };
  } catch (error) {
    // В случае ошибки возвращаем пустой контекст
    // Это позволит работать без аутентификации
    console.error('[tRPC context] Error creating context:', error);
    return {
      session: null,
      user: null,
    };
  }
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>;
