'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TournamentPage() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на новую страницу со списком турниров
    router.push('/tournaments');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 text-lg">Загрузка турниров...</p>
      </div>
    </div>
  );
}