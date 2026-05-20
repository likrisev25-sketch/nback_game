'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { LobbyProvider } from '@/contexts/LobbyContext';
import { LobbyList } from '@/components/lobby/LobbyList';
import { useSession } from '@/lib/auth-client';

export default function LobbiesPage() {
  const {
    data: session,
    isLoading,
  } = useSession();

  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [session, isLoading, router]);

  // Loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Пока редиректим
  if (!session) {
    return null;
  }

  return (
    <LobbyProvider
      userId={session.user.id}
      userName={session.user.name ?? 'Игрок'}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LobbyList />
      </div>
    </LobbyProvider>
  );
}