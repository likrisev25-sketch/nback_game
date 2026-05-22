'use client';

import React from 'react';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/UserMenu';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Логотип */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🧠</span>
            <span className="hidden sm:inline">NBACK GAME</span>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/about"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              🧠 О игре
            </Link>
            <Link
              href="/how-to-play"
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium text-sm transition-colors"
            >
              📖 Как играть
            </Link>
            <Link
              href="/training"
              className="text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 font-medium text-sm transition-colors"
            >
              🏋️ Тренировка
            </Link>
            <Link
              href="/tournament-info"
              className="text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium text-sm transition-colors"
            >
              🏆 Турниры
            </Link>
            <Link
              href="/lobbies"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors"
            >
              🎮 Игра
            </Link>
          </nav>

          {/* Правая часть: профиль или кнопки входа */}
          <div className="flex items-center">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
};
