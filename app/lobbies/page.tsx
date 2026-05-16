'use client';

import { LobbyProvider } from '@/contexts/LobbyContext';
import { LobbyList } from '@/components/lobby/LobbyList';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LobbiesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <LobbyProvider userId={session.user.id} userName={session.user.name}>
      <LobbyList />
    </LobbyProvider>
  );
}
