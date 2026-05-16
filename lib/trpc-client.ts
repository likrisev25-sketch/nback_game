import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/trpc';

// Создаём React-хук для вызова процедур tRPC
export const trpc = createTRPCReact<AppRouter>();
