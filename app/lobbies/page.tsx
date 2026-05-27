'use client';

import { useRouter } from 'next/navigation';
import { SimpleLobby } from '@/components/game/SimpleLobby';
import { useSession } from '@/lib/auth-client';

export default function LobbiesPage() {
  const { data: session, isLoading } = useSession();
  const router = useRouter();

  // Пока загружается сессия
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Если не авторизован - редиректим на вход
  if (!session?.user) {
    router.push('/login');
    return null;
  }

  // Авторизован - показываем SimpleLobby
  return <SimpleLobby />;
}