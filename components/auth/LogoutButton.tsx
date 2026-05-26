// Файл: LogoutButton.tsx
'use client';

import React from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  variant?: 'button' | 'icon';
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    console.log('🔵 [LogoutButton] Logging out...');
    await authClient.signOut();
    console.log('🔵 [LogoutButton] Sign out complete, refreshing...');
    router.refresh();
    window.location.href = '/';
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        className={`p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors ${className}`}
        title="Выйти"
        aria-label="Выйти"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ${className}`}
    >
      Выйти
    </button>
  );
};
