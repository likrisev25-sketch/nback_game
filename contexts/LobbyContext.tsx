'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lobby, LobbyPlayer, LobbySettings } from '@/types/lobby';

interface LobbyContextType {
  // Состояние
  socket: Socket | null;
  currentLobby: Lobby | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Методы
  connect: () => void;
  disconnect: () => void;
  joinLobby: (lobbyId: string, userId: string, name: string) => void;
  leaveLobby: (lobbyId: string) => void;
  setReady: (lobbyId: string, isReady: boolean) => void;
  startGame: (lobbyId: string) => void;
  toggleAutoStart: (lobbyId: string) => void;
  updateSettings: (lobbyId: string, settings: LobbySettings) => void;
  kickPlayer: (lobbyId: string, playerId: string) => void;
  sendHeartbeat: (lobbyId: string) => void;
  sendMessage: (lobbyId: string, message: string) => void;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentLobby, setCurrentLobby] = useState<Lobby | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация Socket.IO
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const newSocket = io(socketUrl, {
      path: '/api/socket',
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ [Socket] Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 [Socket] Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ [Socket] Connection error:', err);
      setError('Не удалось подключиться к серверу');
    });

    // Обработчики событий лобби
    newSocket.on('lobby:update', (data: { lobby: Lobby }) => {
      setCurrentLobby(data.lobby);
    });

    newSocket.on('lobby:player-joined', (data: { lobbyId: string; player: LobbyPlayer }) => {
      console.log('👤 [Lobby] Player joined:', data.player.name);
      setCurrentLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, data.player],
          currentPlayers: prev.currentPlayers + 1,
        };
      });
    });

    newSocket.on('lobby:player-left', (data: { lobbyId: string; playerId: string }) => {
      console.log('🚪 [Lobby] Player left');
      setCurrentLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.userId !== data.playerId),
          currentPlayers: Math.max(0, prev.currentPlayers - 1),
        };
      });
    });

    newSocket.on('lobby:player-ready', (data: { lobbyId: string; playerId: string; isReady: boolean }) => {
      setCurrentLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.userId === data.playerId ? { ...p, isReady: data.isReady } : p
          ),
        };
      });
    });

    newSocket.on('lobby:countdown', (data: { lobbyId: string; seconds: number }) => {
      console.log('⏱️ [Lobby] Countdown:', data.seconds);
      // Можно добавить визуальное отображение countdown
    });

    newSocket.on('lobby:start-game', (data: { lobbyId: string; sessionId: string }) => {
      console.log('🎮 [Lobby] Game starting:', data.sessionId);
      // Перенаправление на страницу игры
      window.location.href = `/game/${data.sessionId}`;
    });

    newSocket.on('lobby:auto-start-toggled', (data: { lobbyId: string; enabled: boolean }) => {
      console.log('⚡ [Lobby] Auto-start toggled:', data.enabled);
      setCurrentLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          autoStartEnabled: data.enabled,
        };
      });
    });

    newSocket.on('lobby:host-transferred', (data: { lobbyId: string; newHostId: string }) => {
      console.log('👑 [Lobby] New host:', data.newHostId);
      setCurrentLobby((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) => ({
            ...p,
            isHost: p.userId === data.newHostId,
          })),
          hostId: data.newHostId,
        };
      });
    });

    newSocket.on('lobby:error', (data: { message: string; code?: string }) => {
      console.error('❌ [Lobby] Error:', data.message);
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  const joinLobby = useCallback((lobbyId: string, userId: string, name: string) => {
    if (!socket) {
      console.error('❌ Socket not initialized');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    socket.emit('lobby:join', { lobbyId, userId, name });
    
    // Таймаут если не получили ответ
    setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, [socket]);

  const leaveLobby = useCallback((lobbyId: string) => {
    if (!socket) return;
    
    socket.emit('lobby:leave', { lobbyId, userId: userId || '' });
    setCurrentLobby(null);
  }, [socket, userId]);

  const setReady = useCallback((lobbyId: string, isReady: boolean) => {
    if (!socket) return;
    
    socket.emit('lobby:ready', { lobbyId, userId: userId || '', isReady });
  }, [socket, userId]);

  const startGame = useCallback((lobbyId: string) => {
    if (!socket) return;
    
    socket.emit('lobby:start', { lobbyId, hostId: userId || '' });
  }, [socket, userId]);

  const toggleAutoStart = useCallback((lobbyId: string) => {
    if (!socket) return;
    
    socket.emit('lobby:toggle-auto-start', { lobbyId, hostId: userId || '' });
  }, [socket, userId]);

  const updateSettings = useCallback((lobbyId: string, settings: LobbySettings) => {
    if (!socket) return;
    
    socket.emit('lobby:settings', { lobbyId, hostId: userId || '', settings });
  }, [socket, userId]);

  const kickPlayer = useCallback((lobbyId: string, playerId: string) => {
    if (!socket) return;
    
    socket.emit('lobby:kick', { lobbyId, hostId: userId || '', playerId });
  }, [socket, userId]);

  const sendHeartbeat = useCallback((lobbyId: string) => {
    if (!socket) return;
    
    socket.emit('lobby:heartbeat', { lobbyId, userId: userId || '' });
  }, [socket, userId]);

  const sendMessage = useCallback((lobbyId: string, message: string) => {
    if (!socket) return;
    
    socket.emit('lobby:chat', { lobbyId, userId: userId || '', message });
  }, [socket, userId]);

  // Автоматический heartbeat каждые 15 секунд
  useEffect(() => {
    if (!socket || !currentLobby) return;

    const interval = setInterval(() => {
      sendHeartbeat(currentLobby.id);
    }, 15000);

    return () => clearInterval(interval);
  }, [socket, currentLobby, sendHeartbeat]);

  return (
    <LobbyContext.Provider
      value={{
        socket,
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
        sendHeartbeat,
        sendMessage,
      }}
    >
      {children}
    </LobbyContext.Provider>
  );
};
