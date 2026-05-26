// Файл: AuthModal.tsx
'use client';

import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Затемнение фона */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Закрыть"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Заголовок */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {mode === 'login'
              ? 'Войдите для сохранения прогресса'
              : 'Создайте аккаунт для отслеживания статистики'}
          </p>
        </div>

        {/* Форма */}
        {mode === 'login' ? (
          <LoginForm
            onSuccess={onClose}
            onSwitchToRegister={() => setMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={onClose}
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};
