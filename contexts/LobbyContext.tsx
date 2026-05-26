// Файл: LobbyContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Lobby, LobbyPlayer, LobbySettings } from '@/types/lobby';

interface LobbyContextType {
  // Состояние
  currentLobby: Lobby | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Методы (теперь REST API)
  connect: () => void;
  disconnect: () => void;
  joinLobby: (lobbyId: string, userId: string, name: string) => Promise<void>;
  leaveLobby: (lobbyId: string, userId: string) => Promise<void>;
  setReady: (lobbyId: string, userId: string, isReady: boolean) => Promise<void>;
  startGame: (lobbyId: string, hostId: string) => Promise<void>;
  toggleAutoStart: (lobbyId: string, hostId: string) => Promise<void>;
  updateSettings: (lobbyId: string, settings: LobbySettings) => Promise<void>;
  kickPlayer: (lobbyId: string, hostId: string, playerId: string) => Promise<void>;
  refreshLobby: (lobbyId: string) => Promise<void>;
}

const LobbyContext = createContext<LobbyContextType | undefined>(undefined);

export const useLobby = () => {
  const context = useContext(LobbyContext);
  if (!context) {
    throw new Error('useLobby must be used within a LobbyProvider');
  }
  return context;
};

interface LobbyProviderProps {
  children: ReactNode;
  userId?: string;
  userName?: string;
}

export const LobbyProvider: React.FC<LobbyProviderProps> = ({ 
  children, 
  userId, 
  userName 
}) => {
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    setIsConnected(true);
    setError(null);
  }, []);
    
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setCurrentLobby(null);
  }, []);

  const joinLobby = useCallback(async (lobbyId: string, userId: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join lobby');
      }

      setCurrentLobby(data.lobby);
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join lobby';
      setError(errorMessage);
      console.error('Error joining lobby:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveLobby = useCallback(async (lobbyId: string, userId: string) => {
    try {
      await fetch(`/api/lobby/${lobbyId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setCurrentLobby(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  }, []);

  const setReady = useCallback(async (lobbyId: string, userId: string, isReady: boolean) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isReady }),
      });

      const data = await response.json();

      if (data.success) {
        // Обновляем локальное состояние
        setCurrentLobby(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p =>
              p.userId === userId ? { ...p, isReady } : p
            ),
          };
        });
      } else {
        throw new Error(data.error || 'Failed to update ready status');
      }
    } catch (error) {
      console.error('Error setting ready:', error);
    }
  }, []);

  const startGame = useCallback(async (lobbyId: string, hostId: string) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      });

      const data = await response.json();

      if (data.success) {
        // Перенаправляем на страницу игры
        window.location.href = `/game/${data.sessionId}`;
      } else {
        throw new Error(data.error || 'Failed to start game');
      }
    } catch (error) {
      console.error('Error starting game:', error);
      setError(error instanceof Error ? error.message : 'Failed to start game');
    }
  }, []);

  const toggleAutoStart = useCallback(async (lobbyId: string, hostId: string) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/auto-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentLobby(prev => {
          if (!prev) return prev;
          return { ...prev, autoStartEnabled: data.autoStartEnabled };
        });
      } else {
        throw new Error(data.error || 'Failed to toggle auto-start');
      }
    } catch (error) {
      console.error('Error toggling auto-start:', error);
    }
  }, []);

  const updateSettings = useCallback(async (lobbyId: string, settings: LobbySettings) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setCurrentLobby(prev => prev ? { ...prev, ...settings } : null);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, []);

  const kickPlayer = useCallback(async (lobbyId: string, hostId: string, playerId: string) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId, playerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to kick player');
      }

      // Обновляем список игроков
      setCurrentLobby(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter(p => p.userId !== playerId),
          currentPlayers: prev.currentPlayers - 1,
        };
      });
    } catch (error) {
      console.error('Error kicking player:', error);
    }
  }, []);

  const refreshLobby = useCallback(async (lobbyId: string) => {
    try {
      const response = await fetch(`/api/lobby/${lobbyId}`);
      const data = await response.json();

      if (data.success) {
        setCurrentLobby(data.lobby);
      }
    } catch (error) {
      console.error('Error refreshing lobby:', error);
    }
  }, []);

  return (
    <LobbyContext.Provider
      value={{
        currentLobby,
        isConnected,
        isLoading,
        error,
        connect,
        disconnect,
        joinLobby,
        leaveLobby,
        setReady,
        startGame,
        toggleAutoStart,
        updateSettings,
        kickPlayer,
        refreshLobby,
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
};
