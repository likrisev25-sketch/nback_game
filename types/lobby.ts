// Файл: lobby.ts
// Types для системы лобби и WebSocket

export interface LobbyPlayer {
  id: string;
  userId: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  connectionId?: string;
  lastHeartbeat?: string;
  joinedAt: string;
}

export interface Lobby {
  id: string;
  gameId: string;
  name: string;
  status: 'waiting' | 'countdown' | 'in_progress' | 'finished';
  nValue: number;
  baseSpeedMs: number;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  hostId: string;
  password?: string | null;
  autoStartEnabled: boolean; // Автозапуск когда все места заняты и все готовы
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  players: LobbyPlayer[];
}

export interface CreateLobbyDto {
  gameId: string;
  name?: string;
  nValue?: number;
  baseSpeedMs?: number;
  maxPlayers?: number;
  password?: string;
}

export interface JoinLobbyDto {
  lobbyId: string;
  userId: string;
  name: string;
}

export interface LobbySettings {
  nValue: number;
  baseSpeedMs: number;
  maxPlayers: number;
}

// ============================================
// WebSocket Events
// ============================================

export interface WebSocketMessages {
  // Клиент → Сервер
  'lobby:join': {
    lobbyId: string;
    userId: string;
    name: string;
  };
  'lobby:leave': {
    lobbyId: string;
    userId: string;
  };
  'lobby:ready': {
    lobbyId: string;
    userId: string;
    isReady: boolean;
  };
  'lobby:start': {
    lobbyId: string;
    hostId: string;
  };
  'lobby:heartbeat': {
    lobbyId: string;
    userId: string;
  };
  'lobby:kick': {
    lobbyId: string;
    hostId: string;
    playerId: string;
  };
  'lobby:settings': {
    lobbyId: string;
    hostId: string;
    settings: LobbySettings;
  };
  'lobby:chat': {
    lobbyId: string;
    userId: string;
    message: string;
  };

  // Сервер → Клиент
  'lobby:update': {
    lobby: Lobby;
  };
  'lobby:player-joined': {
    lobbyId: string;
    player: LobbyPlayer;
  };
  'lobby:player-left': {
    lobbyId: string;
    playerId: string;
  };
  'lobby:player-ready': {
    lobbyId: string;
    playerId: string;
    isReady: boolean;
  };
  'lobby:countdown': {
    lobbyId: string;
    seconds: number;
  };
  'lobby:start-game': {
    lobbyId: string;
    sessionId: string;
  };
  'lobby:error': {
    message: string;
    code?: string;
  };
  'lobby:host-transferred': {
    lobbyId: string;
    newHostId: string;
  };
}

export type ServerEvents = keyof Pick<
  WebSocketMessages,
  'lobby:update' | 'lobby:player-joined' | 'lobby:player-left' | 
  'lobby:player-ready' | 'lobby:countdown' | 'lobby:start-game' | 
  'lobby:error' | 'lobby:host-transferred'
>;

export type ClientEvents = keyof Pick<
  WebSocketMessages,
  'lobby:join' | 'lobby:leave' | 'lobby:ready' | 'lobby:start' | 
  'lobby:heartbeat' | 'lobby:kick' | 'lobby:settings' | 'lobby:chat'
>;
