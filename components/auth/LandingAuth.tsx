'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface LandingAuthProps {
  onAuthSuccess?: () => void;
}

/**
 * Стартовая страница с авторизацией
 * Показывает формы входа/регистрации перед доступом к игре
 */
export function LandingAuth({ onAuthSuccess }: LandingAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');

  const handleSuccess = () => {
    onAuthSuccess?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Основной контент */}
      <div className="relative z-10 w-full max-w-md">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-2xl">
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            NBACK GAME
          </h1>
          <p className="text-blue-200 text-lg">
            Тренируй свой мозг
          </p>
        </div>

        {/* Карточка авторизации */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Переключатель режимов */}
          <div className="flex mb-6 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                mode === 'login'
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                mode === 'register'
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Формы */}
          {mode === 'login' ? (
            <LoginForm onSuccess={handleSuccess} />
          ) : (
            <RegisterForm onSuccess={handleSuccess} />
          )}

          {/* Дополнительная информация */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
              <span>🔒</span>
              <span>Безопасный вход через Better Auth</span>
            </div>
          </div>
        </div>

        {/* Преимущества */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-white/80">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xs">Фокус</div>
          </div>
          <div className="text-white/80">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-xs">Память</div>
          </div>
          <div className="text-white/80">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs">Рейтинг</div>
          </div>
        </div>
      </div>

      {/* Анимация blob */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
