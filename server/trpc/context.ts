import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { db } from '@/db/db';
import { getSessionFromRequest } from '@/lib/session';

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await getSessionFromRequest(opts.req);
  
  return {
    db,
    session,
    user: session?.user || null,
    headers: opts.headers,
  };
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>;