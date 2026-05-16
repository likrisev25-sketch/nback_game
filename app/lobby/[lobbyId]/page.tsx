'use client';

import { useEffect, useState } from 'react';
import { LobbyProvider } from '@/contexts/LobbyContext';
import { LobbyRoom } from '@/components/lobby/LobbyRoom';
import { useSession } from '@/lib/auth-client';
import { useRouter, useParams } from 'next/navigation';
import { Lobby } from '@/types/lobby';

export default function LobbyPage() {
  const params = useParams();
  const lobbyId = params.lobbyId as string;
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push('/login');
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (session && lobbyId) {
      // Загружаем данные лобби
      fetch(`/api/lobby/${lobbyId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setLobbyData(data.lobby);
          }
        })
        .catch(err => {
          console.error('Error loading lobby:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [session, lobbyId]);

  if (sessionPending || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !lobbyData) {
    return null;
  }

  return (
    <LobbyProvider userId={session.user.id} userName={session.user.name}>
      <LobbyRoom lobbyId={lobbyId} />
    </LobbyProvider>
  );
}
