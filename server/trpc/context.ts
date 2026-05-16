import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';

// Создаём контекст для tRPC - это объект, который будет доступен всем роутам
export async function createContext(_options: FetchCreateContextFnOptions) {
  return {
    session: null,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
