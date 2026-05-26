// Файл: AuthForm.tsx
'use client';

import React, { useState } from 'react';
import { authClient } from '@/lib/auth-client';

const { signIn, signUp } = authClient;

type AuthMode = 'signin' | 'signup';

/**
 * Компонент формы аутентификации
 * 
 * Предоставляет интерфейс для входа и регистрации пользователей
 * с использованием better-auth
 */
export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      // После успешной входа/регистрации перезагрузим страницу
      window.location.href = '/';
    } catch (err: unknown) {
      setError((err as Error).message || (err as Error).toString() || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            N-Back Game
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Тренажёр памяти и внимания
          </p>
        </div>

        {/* Переключатель режимов */}
        <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Вход
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              mode === 'signup'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Имя (только для регистрации) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Имя
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите ваше имя"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          {/* Пароль */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Минимум 6 символов
            </p>
          </div>

          {/* Кнопка отправки */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : mode === 'signin'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Загрузка...' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* Информация */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            {mode === 'signin' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {mode === 'signin' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
