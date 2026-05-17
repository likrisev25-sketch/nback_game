// Простой клиент аутентификации (без Better Auth)

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🔵 [auth-client] API_URL:', API_URL);

export const authClient = {
  // Регистрация
  signUp: async (email: string, password: string, name: string) => {
    console.log('🔵 [auth-client] signUp called:', email);
    const response = await fetch(`${API_URL}/api/auth/sign-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [auth-client] signUp error:', error);
      throw new Error(error.error || 'Registration failed');
    }
    
    const data = await response.json();
    console.log('✅ [auth-client] signUp success:', data);
    return data;
  },
  
  // Вход
  signIn: async (email: string, password: string) => {
    console.log('🔵 [auth-client] signIn called:', email);
    const response = await fetch(`${API_URL}/api/auth/sign-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [auth-client] signIn error:', error);
      throw new Error(error.error || 'Sign in failed');
    }
    
    const data = await response.json();
    console.log('✅ [auth-client] signIn success:', data);
    return data;
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
