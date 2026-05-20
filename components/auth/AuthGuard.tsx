'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';

import { useSession } from '@/lib/auth-client';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Компонент-обёртка для защиты контента
 * Показывает children только для авторизованных пользователей
 *
 * Примеры использования:
 *
 * 1. Со стандартным fallback:
 * <AuthGuard>
 *   <PrivateContent />
 * </AuthGuard>
 *
 * 2. С кастомным fallback:
 * <AuthGuard fallback={<CustomLoginPrompt />}>
 *   <PrivateContent />
 * </AuthGuard>
 */

export function AuthGuard({
  children,
  fallback,
}: AuthGuardProps) {
  const {
    data: session,
    isLoading,
  } = useSession();

  // Пока загружается сессия
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Если не авторизован
  if (!session?.user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Стандартный fallback
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">
          🔒
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Требуется авторизация
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Войдите в аккаунт, чтобы получить доступ к этому разделу
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          На главную
        </Link>
      </div>
    );
  }

  // Авторизован — показываем контент
  return <>{children}</>;
}

/**
 * HOC для защиты страниц
 *
 * Пример:
 * const ProtectedPage = withAuth(MyPage);
 */

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WithAuth(props: P) {
    return (
      <AuthGuard>
        <Component {...props} />
      </AuthGuard>
    );
  };
}