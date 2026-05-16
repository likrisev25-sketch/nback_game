import { createAuthClient } from 'better-auth/react';

// Создаём клиент авторизации
// baseURL должен быть публичной переменной (NEXT_PUBLIC_*)
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession } = authClient;
