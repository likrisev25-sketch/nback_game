import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc';
import { createTRPCContext } from '@/server/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async (opts) => {
      return createTRPCContext(opts);
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error, input }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}`
            );
            console.error('Error:', error);
            console.error('Input:', input);
            console.error('Stack:', error.stack);
          }
        : undefined,
  });

export { handler as GET, handler as POST };