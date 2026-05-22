'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

import { useSession } from '@/lib/auth-client';
import { LogoutButton } from './LogoutButton';
import { AuthModal } from './AuthModal';

// Модульный кэш для сессии
let sessionCache: { user: { id: string; name: string; email: string } } | null = null;
let cacheLoaded: boolean = false;

export const UserMenu: React.FC = () => {
  const {
    data: session,
    isLoading,
  } = useSession();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasLoadedRef = useRef<boolean>(cacheLoaded);

  // Кэшируем сессию на уровне компонента
  useEffect(() => {
    if (session && !hasLoadedRef.current) {
      sessionCache = session.user;
      cacheLoaded = true;
      hasLoadedRef.current = true;
    }
  }, [session]);

  const openLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
  };

  // Используем кэшированную сессию или текущую
  const cachedSession = sessionCache || session;

  const displayName =
    cachedSession?.user?.name ||
    cachedSession?.user?.email?.split('@')[0] ||
    'Пользователь';

  const avatarLetter = displayName.charAt(0).toUpperCase();

  // Загрузка сессии - показываем скелетон только при первой загрузке
  if (isLoading && !cachedSession) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  // Не авторизован
  if (!cachedSession?.user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={openLogin}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Войти
          </button>

          <button
            onClick={openRegister}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Регистрация
          </button>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      </>
    );
  }

  // Авторизован
  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {avatarLetter}
          </div>

          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block max-w-[120px] truncate">
            {displayName}
          </span>

          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isMenuOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Выпадающее меню */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {cachedSession.user.name || displayName}
                </p>

                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {cachedSession.user.email}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>

                  Профиль
                </Link>

                <Link
                  href="/leaderboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>

                  Таблица лидеров
                </Link>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
                <div className="px-4 py-2">
                  <LogoutButton variant="button" className="w-full text-left" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};