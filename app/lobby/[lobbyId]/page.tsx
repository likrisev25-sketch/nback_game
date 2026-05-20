'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { LobbyProvider } from '@/contexts/LobbyContext';
import { LobbyRoom } from '@/components/lobby/LobbyRoom';
import { useSession } from '@/lib/auth-client';
import { Lobby } from '@/types/lobby';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();

  const lobbyId = params.lobbyId as string;

  // FIX: use isLoading instead of isPending
  const {
    data: session,
    isLoading: sessionLoading,
  } = useSession();

  const [lobbyData, setLobbyData] = useState<Lobby | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push('/login');
    }
  }, [session, sessionLoading, router]);

  // Load lobby data
  useEffect(() => {
    if (!session || !lobbyId) return;

    const loadLobby = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/lobby/${lobbyId}`);
        const data = await response.json();

        if (data.success) {
          setLobbyData(data.lobby);
        } else {
          console.error('Failed to load lobby');
        }
      } catch (error) {
        console.error('Error loading lobby:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLobby();
  }, [session, lobbyId]);

  // Global loader
  if (sessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirecting or no lobby
  if (!session || !lobbyData) {
    return null;
  }

  return (
    <LobbyProvider
      userId={session.user.id}
      userName={session.user.name ?? 'Игрок'}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LobbyRoom lobbyId={lobbyId} />
      </div>
    </LobbyProvider>
  );
}