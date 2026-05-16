import { db } from '@/db/db';

console.log('⚠️  [auth] Authentication is temporarily disabled for demo purposes');

// Временный мок-объект auth для демонстрации
export const auth = {
  handlers: {
    GET: async () => new Response(JSON.stringify({ message: 'Auth disabled' }), { status: 501 }),
    POST: async () => new Response(JSON.stringify({ message: 'Auth disabled' }), { status: 501 }),
  },
  $Infer: {
    Session: {} as any,
  },
} as any;

export type Session = any;
