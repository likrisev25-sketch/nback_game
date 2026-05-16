import { createAuthClient } from 'better-auth/react';

// Получаем baseURL для авторизации
// В браузере используем текущий origin, на сервере — переменную окружения
const getAuthBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Для серверного рендеринга используем переменную окружения
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
