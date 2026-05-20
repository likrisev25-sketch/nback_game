'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import { useRouter } from 'next/navigation';

import { NBackGame } from '@/components/game/NBackGame';
import { GameLobby } from '@/components/game/GameLobby';
import { LandingAuth } from '@/components/auth/LandingAuth';

import { useSession } from '@/lib/auth-client';

export default function Home() {
  const router = useRouter();

  // FIX: isPending -> isLoading
  const {
    data: session,
    isLoading: sessionLoading,
    mutate: refetchSession,
  } = useSession();

  const isMounted = useRef<boolean>(true);
  const joiningRef = useRef<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [currentScreen, setCurrentScreen] = useState<
    'menu' | 'lobby' | 'game'
  >('menu');

  // Create game state
  const [newGameName, setNewGameName] = useState<string>('');
  const [nValue, setNValue] = useState<number>(3);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);

  const [addBot, setAddBot] = useState<boolean>(false);
  const [botAccuracy, setBotAccuracy] = useState<number>(80);

  // Join game state
  const [joinGameId, setJoinGameId] = useState<string>('');

  const [gameError, setGameError] = useState<string | null>(null);

  // Current game state
  const [currentSessionId, setCurrentSessionId] =
    useState<string | null>(null);

  const [currentPlayerId, setCurrentPlayerId] =
    useState<string | null>(null);

  // Active games
  const [activeGames, setActiveGames] = useState<
    Array<{
      id: string;
      name: string;
      nValue: number;
      playerCount: number;
      maxPlayers: number;
      canJoin: boolean;
      createdAt: string;
    }>
  >([]);

  const [loadingGames, setLoadingGames] =
    useState<boolean>(false);

  const playerName =
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    'Игрок';

  // Cleanup
  useEffect(() => {
    isMounted.current = true;

    if (!sessionLoading && !session?.user) {
      sessionIntervalRef.current = setInterval(async () => {
        if (!isMounted.current) return;

        console.log('🔵 [session polling] Checking session...');

        await refetchSession();
      }, 2000);
    }

    return () => {
      isMounted.current = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sessionLoading, session?.user, refetchSession]);

  // Load active games
  const loadActiveGames = useCallback(async () => {
    if (!isMounted.current) return;

    setLoadingGames(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/game/list', {
        signal: abortControllerRef.current.signal,
      });

      if (!isMounted.current) return;

      if (response.ok) {
        const data = await response.json();

        setActiveGames(data.games || []);
      } else {
        setActiveGames([]);
      }
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        return;
      }

      if (isMounted.current) {
        setActiveGames([]);
      }
    } finally {
      if (isMounted.current) {
        setLoadingGames(false);
      }
    }
  }, []);

  useEffect(() => {
    if (currentScreen === 'menu') {
      loadActiveGames();

      intervalRef.current = setInterval(() => {
        if (
          currentScreen === 'menu' &&
          isMounted.current
        ) {
          loadActiveGames();
        }
      }, 10000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [currentScreen, loadActiveGames]);

  // Join session
  const joinSession = useCallback(
    async (sessionId: string) => {
      if (joiningRef.current) return;

      joiningRef.current = true;

      setGameError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current =
        new AbortController();

      try {
        const response = await fetch('/api/game/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            playerName,
            userId: session?.user?.id,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!isMounted.current) {
          joiningRef.current = false;
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Ошибка сервера: ${response.status}`
          );
        }

        const data = await response.json();

        if (!data.playerId) {
          throw new Error(
            'Сервер не вернул playerId'
          );
        }

        setCurrentSessionId(sessionId);
        setCurrentPlayerId(data.playerId);

        setCurrentScreen('lobby');
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        if (isMounted.current) {
          const message =
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка';

          setGameError(message);

          alert(
            'Ошибка присоединения: ' + message
          );
        }
      } finally {
        if (isMounted.current) {
          joiningRef.current = false;
        }
      }
    },
    [playerName, session]
  );

  // Loading screen
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!session?.user) {
    return <LandingAuth />;
  }

  // Main page
  return (
    <div className="w-full">
      {gameError && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
            <strong>Ошибка: </strong>

            <span className="block sm:inline">
              {gameError}
            </span>

            <button
              onClick={() => setGameError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-xl">
                &times;
              </span>
            </button>
          </div>
        </div>
      )}

      <section className="text-center py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
          Тренируй свой мозг
        </h1>

        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-blue-600 dark:text-blue-400">
          NBACK GAME
        </h2>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Развивай рабочую память и
          концентрацию
        </p>

        <button
          onClick={() =>
            router.push('/tournament')
          }
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold"
        >
          🏆 Турниры
        </button>
      </section>
    </div>
  );
}