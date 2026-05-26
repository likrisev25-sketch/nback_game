import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getSessionFromRequest } from '@/lib/session';

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await getSessionFromRequest(opts.req as any);

  return {
    session,
    user: session?.user || null,
  };
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>;