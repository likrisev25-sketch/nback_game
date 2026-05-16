// Простой клиент аутентификации без better-auth

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const authClient = {
  // Регистрация
  signUp: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/api/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    
    return response.json();
  },
  
  // Вход
  signIn: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Sign in failed');
    }
    
    return response.json();
  },
  
  // Выход
  signOut: async () => {
    const response = await fetch(`${API_URL}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
    });
    
    return response.json();
  },
  
  // Получение сессии
  getSession: async () => {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      return { user: null, session: null };
    }
    
    return response.json();
  },
};

// Хуки для React
export const useSession = () => {
  // Это будет реализовано через React Query в компонентах
  return { data: null, isLoading: false };
};

export const { signIn, signUp, signOut, getSession } = authClient;
