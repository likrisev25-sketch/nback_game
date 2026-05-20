import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers } from '@/db/schema';
import { eq, and, not, isNull } from 'drizzle-orm';
import { eq as eqUser } from 'drizzle-orm';
import { users } from '@/db/schema';
import { Lobby, LobbyPlayer, LobbySettings } from '@/types/lobby';

let io: SocketIOServer | null = null;

interface PlayerConnection {
  userId: string;
  lobbyId: string;
  connectionId: string;
  lastHeartbeat: Date;
}

const playerConnections = new Map<string, PlayerConnection>(); // connectionId -> PlayerConnection
const lobbyRooms = new Map<string, Set<string>>(); // lobbyId -> Set<connectionId>

// Heartbeat интервал для проверки активных игроков
const HEARTBEAT_TIMEOUT = 30000; // 30 секунд

export function initSocket(server: HTTPServer): Server {
  if (io) return io;

  io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔵 [Socket] Client connected: ${socket.id}`);

    // Присоединение к лобби
    socket.on('lobby:join', async (data: { lobbyId: string; userId: string; name: string }) => {
      try {
        const { lobbyId, userId, name } = data;

        // Проверяем существование лобби
        const [lobby] = await db
          .select()
          .from(lobbies)
          .where(eq(lobbies.id, lobbyId))
          .limit(1);

        if (!lobby) {
          socket.emit('lobby:error', { message: 'Лобби не найдено' });
          return;
        }

        // Проверяем пароль
        if (lobby.password) {
          // TODO: Добавить проверку пароля
        }

        // Проверяем количество игроков
        const [playerCount] = await db
          .select({ count: lobbyPlayers.id })
          .from(lobbyPlayers)
          .where(eq(lobbyPlayers.lobbyId, lobbyId));

        if (playerCount && Number(playerCount.count) >= lobby.maxPlayers) {
          socket.emit('lobby:error', { message: 'Лобби заполнено' });
          return;
        }

        // Проверяем не зарегистрирован ли уже игрок
        const existingPlayer = await db
          .select()
          .from(lobbyPlayers)
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              eq(lobbyPlayers.userId, userId)
            )
          )
          .limit(1);

        if (existingPlayer.length === 0) {
          // Добавляем игрока в лобби
          const isHost = lobby.hostId === userId;
          await db.insert(lobbyPlayers).values({
            id: nanoid(),
            lobbyId,
            userId,
            name,
            isReady: false,
            isHost,
            connectionId: socket.id,
            lastHeartbeat: new Date().toISOString(),
            joinedAt: new Date().toISOString(),
          });

          // Обновляем счетчик игроков
          await db
            .update(lobbies)
            .set({
              currentPlayers: lobby.currentPlayers + 1,
            })
            .where(eq(lobbies.id, lobbyId));
        }

        // Присоединяемся к комнате лобби
        socket.join(`lobby:${lobbyId}`);

        // Сохраняем соединение
        playerConnections.set(socket.id, {
          userId,
          lobbyId,
          connectionId: socket.id,
          lastHeartbeat: new Date(),
        });

        // Добавляем в комнату
        if (!lobbyRooms.has(lobbyId)) {
          lobbyRooms.set(lobbyId, new Set());
        }
        lobbyRooms.get(lobbyId)!.add(socket.id);

        // Получаем обновлённое состояние лобби
        const updatedLobby = await getLobbyWithPlayers(lobbyId);
        if (updatedLobby) {
          socket.emit('lobby:update', { lobby: updatedLobby });
          
          // Уведомляем других игроков
          socket.to(`lobby:${lobbyId}`).emit('lobby:player-joined', {
            lobbyId,
            player: updatedLobby.players.find(p => p.userId === userId),
          });

          // Проверяем автозапуск когда все места заняты
          if (updatedLobby.autoStartEnabled && 
              updatedLobby.currentPlayers >= updatedLobby.maxPlayers && 
              updatedLobby.status === 'waiting') {
            // Все места заняты и автозапуск включен - запускаем игру
            const hostPlayer = updatedLobby.players.find(p => p.userId === updatedLobby.hostId);
            if (hostPlayer) {
              startCountdown(socket, lobbyId, updatedLobby.hostId);
            }
          }
        }
      } catch (error) {
        console.error('[Socket] Error joining lobby:', error);
        socket.emit('lobby:error', { message: 'Ошибка при присоединении к лобби' });
      }
    });

    // Выход из лобби
    socket.on('lobby:leave', async (data: { lobbyId: string; userId: string }) => {
      try {
        const { lobbyId, userId } = data;

        await handlePlayerLeave(socket, lobbyId, userId);
      } catch (error) {
        console.error('[Socket] Error leaving lobby:', error);
        socket.emit('lobby:error', { message: 'Ошибка при выходе из лобби' });
      }
    });

    // Обновление статуса готовности
    socket.on('lobby:ready', async (data: { lobbyId: string; userId: string; isReady: boolean }) => {
      try {
        const { lobbyId, userId, isReady } = data;

        await db
          .update(lobbyPlayers)
          .set({ isReady })
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              eq(lobbyPlayers.userId, userId)
            )
          );

        const updatedLobby = await getLobbyWithPlayers(lobbyId);
        if (updatedLobby) {
          io?.to(`lobby:${lobbyId}`).emit('lobby:player-ready', {
            lobbyId,
            playerId: userId,
            isReady,
          });

          // Проверяем готовы ли все игроки
          const allReady = updatedLobby.players.every(p => p.isReady);
          if (allReady && updatedLobby.status === 'waiting' && updatedLobby.currentPlayers >= updatedLobby.minPlayers) {
            // Все готовы и достаточно игроков - запускаем обратный отсчет
            startCountdown(socket, lobbyId, updatedLobby.hostId);
          }
        }
      } catch (error) {
        console.error('[Socket] Error updating ready status:', error);
      }
    });

    // Запуск игры (только host)
    socket.on('lobby:start', async (data: { lobbyId: string; hostId: string }) => {
      try {
        const { lobbyId, hostId } = data;

        const [lobby] = await db
          .select()
          .from(lobbies)
          .where(eq(lobbies.id, lobbyId))
          .limit(1);

        if (!lobby) {
          socket.emit('lobby:error', { message: 'Лобби не найдено' });
          return;
        }

        if (lobby.hostId !== hostId) {
          socket.emit('lobby:error', { message: 'Только хост может запустить игру' });
          return;
        }

        // Проверяем количество игроков
        const players = await db
          .select()
          .from(lobbyPlayers)
          .where(eq(lobbyPlayers.lobbyId, lobbyId));

        if (players.length < lobby.minPlayers) {
          socket.emit('lobby:error', { 
            message: `Недостаточно игроков. Нужно минимум ${lobby.minPlayers}, сейчас ${players.length}`
          });
          return;
        }

        // Проверяем что все игроки готовы
        const allReady = players.every((p) => p.isReady);
        if (!allReady) {
          socket.emit('lobby:error', { message: 'Не все игроки готовы' });
          return;
        }

        startCountdown(socket, lobbyId, hostId);
      } catch (error) {
        console.error('[Socket] Error starting lobby:', error);
      }
    });

    // Переключение автозапуска (только host)
    socket.on('lobby:toggle-auto-start', async (data: { lobbyId: string; hostId: string }) => {
      try {
        const { lobbyId, hostId } = data;

        const [lobby] = await db
          .select()
          .from(lobbies)
          .where(eq(lobbies.id, lobbyId))
          .limit(1);

        if (!lobby) {
          socket.emit('lobby:error', { message: 'Лобби не найдено' });
          return;
        }

        if (lobby.hostId !== hostId) {
          socket.emit('lobby:error', { message: 'Только хост может менять настройки автозапуска' });
          return;
        }

        // Переключаем флаг автозапуска
        const newAutoStartState = !lobby.autoStartEnabled;
        
        await db
          .update(lobbies)
          .set({ autoStartEnabled: newAutoStartState })
          .where(eq(lobbies.id, lobbyId));

        // Уведомляем всех в лобби
        io?.to(`lobby:${lobbyId}`).emit('lobby:auto-start-toggled', {
          lobbyId,
          enabled: newAutoStartState,
        });

        // Если автозапуск включен, достигнуто минимальное количество игроков И все готовы - запускаем игру
        if (newAutoStartState && lobby.currentPlayers >= lobby.minPlayers) {
          // Проверяем что все игроки готовы
          const players = await db
            .select()
            .from(lobbyPlayers)
            .where(eq(lobbyPlayers.lobbyId, lobbyId));
          
          const allReady = players.every((p) => p.isReady);
          if (allReady) {
            startCountdown(socket, lobbyId, hostId);
          }
        }
      } catch (error) {
        console.error('[Socket] Error toggling auto-start:', error);
      }
    });

    // Heartbeat для поддержания активности
    socket.on('lobby:heartbeat', (data: { lobbyId: string; userId: string }) => {
      try {
        const { lobbyId, userId } = data;

        const connection = playerConnections.get(socket.id);
        if (connection) {
          connection.lastHeartbeat = new Date();
        }

        db.update(lobbyPlayers)
          .set({ lastHeartbeat: new Date().toISOString() })
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              eq(lobbyPlayers.userId, userId)
            )
          )
          .catch(console.error);
      } catch (error) {
        console.error('[Socket] Error processing heartbeat:', error);
      }
    });

    // Обновление настроек лобби (только host)
    socket.on('lobby:settings', async (data: { lobbyId: string; hostId: string; settings: LobbySettings }) => {
      try {
        const { lobbyId, hostId, settings } = data;

        const [lobby] = await db
          .select()
          .from(lobbies)
          .where(eq(lobbies.id, lobbyId))
          .limit(1);

        if (!lobby) {
          socket.emit('lobby:error', { message: 'Лобби не найдено' });
          return;
        }

        if (lobby.hostId !== hostId) {
          socket.emit('lobby:error', { message: 'Только хост может менять настройки' });
          return;
        }

        if (lobby.status !== 'waiting') {
          socket.emit('lobby:error', { message: 'Нельзя менять настройки во время игры' });
          return;
        }

        await db
          .update(lobbies)
          .set(settings)
          .where(eq(lobbies.id, lobbyId));

        const updatedLobby = await getLobbyWithPlayers(lobbyId);
        if (updatedLobby) {
          io?.to(`lobby:${lobbyId}`).emit('lobby:update', { lobby: updatedLobby });
        }
      } catch (error) {
        console.error('[Socket] Error updating settings:', error);
      }
    });

    // Kick игрока (только host)
    socket.on('lobby:kick', async (data: { lobbyId: string; hostId: string; playerId: string }) => {
      try {
        const { lobbyId, hostId, playerId } = data;

        const [lobby] = await db
          .select()
          .from(lobbies)
          .where(eq(lobbies.id, lobbyId))
          .limit(1);

        if (!lobby) {
          socket.emit('lobby:error', { message: 'Лобби не найдено' });
          return;
        }

        if (lobby.hostId !== hostId) {
          socket.emit('lobby:error', { message: 'Только хост может кикать игроков' });
          return;
        }

        const [playerToRemove] = await db
          .select()
          .from(lobbyPlayers)
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              eq(lobbyPlayers.userId, playerId)
            )
          )
          .limit(1);

        if (!playerToRemove) {
          socket.emit('lobby:error', { message: 'Игрок не найден' });
          return;
        }

        // Если кикаем хоста - передаем права
        if (playerToRemove.userId === lobby.hostId) {
        const otherPlayers = await db
          .select()
          .from(lobbyPlayers)
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              not(eq(lobbyPlayers.userId, playerId))
            )
          )
          .orderBy(lobbyPlayers.joinedAt)
          .limit(1);

          if (otherPlayers.length > 0) {
            const newHost = otherPlayers[0];
            await db
              .update(lobbyPlayers)
              .set({ isHost: true })
              .where(eq(lobbyPlayers.id, newHost.id));

            io?.to(`lobby:${lobbyId}`).emit('lobby:host-transferred', {
              lobbyId,
              newHostId: newHost.userId,
            });
          }
        }

        // Удаляем игрока
        await db
          .delete(lobbyPlayers)
          .where(
            and(
              eq(lobbyPlayers.lobbyId, lobbyId),
              eq(lobbyPlayers.userId, playerId)
            )
          );

        await db
          .update(lobbies)
          .set({ currentPlayers: lobby.currentPlayers - 1 })
          .where(eq(lobbies.id, lobbyId));

        io?.to(`lobby:${lobbyId}`).emit('lobby:player-left', {
          lobbyId,
          playerId,
        });

        const updatedLobby = await getLobbyWithPlayers(lobbyId);
        if (updatedLobby) {
          io?.to(`lobby:${lobbyId}`).emit('lobby:update', { lobby: updatedLobby });
        }
      } catch (error) {
        console.error('[Socket] Error kicking player:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 [Socket] Client disconnected: ${socket.id}`);
      
      const connection = playerConnections.get(socket.id);
      if (connection) {
        handlePlayerDisconnect(socket.id, connection.lobbyId, connection.userId);
      }
    });
  });

  // Запускаем проверку неактивных игроков
  startInactivePlayerChecker();

  console.log('✅ [Socket] Socket.IO server initialized');
  return io;
}

async function getLobbyWithPlayers(lobbyId: string): Promise<Lobby | null> {
  const [lobby] = await db
    .select()
    .from(lobbies)
    .where(eq(lobbies.id, lobbyId))
    .limit(1);

  if (!lobby) return null;

  const players = await db
    .select()
    .from(lobbyPlayers)
    .where(eq(lobbyPlayers.lobbyId, lobbyId));

  return {
    ...lobby,
    players: players.map((p: typeof schema.lobbyPlayers.$inferSelect) => ({
      ...p,
      isReady: Boolean(p.isReady),
      isHost: Boolean(p.isHost),
    })),
  } as Lobby;
}

async function handlePlayerLeave(socket: { id: string }, lobbyId: string, userId: string) {
  const [player] = await db
    .select()
    .from(lobbyPlayers)
    .where(
      and(
        eq(lobbyPlayers.lobbyId, lobbyId),
        eq(lobbyPlayers.userId, userId)
      )
    )
    .limit(1);

  if (!player) return;

  const [lobby] = await db
    .select()
    .from(lobbies)
    .where(eq(lobbies.id, lobbyId))
    .limit(1);

  if (!lobby) return;

  // Если хост вышел - передаем права
  if (player.isHost) {
    const otherPlayers = await db
      .select()
      .from(lobbyPlayers)
      .where(
        and(
          eq(lobbyPlayers.lobbyId, lobbyId),
          not(eq(lobbyPlayers.userId, userId))
        )
      )
      .orderBy(lobbyPlayers.joinedAt)
      .limit(1);

    if (otherPlayers.length > 0) {
      const newHost = otherPlayers[0];
      await db
        .update(lobbyPlayers)
        .set({ isHost: true })
        .where(eq(lobbyPlayers.id, newHost.id));

      io?.to(`lobby:${lobbyId}`).emit('lobby:host-transferred', {
        lobbyId,
        newHostId: newHost.userId,
      });
    } else {
      // Если больше никого нет - удаляем лобби
      await db.delete(lobbies).where(eq(lobbies.id, lobbyId));
      lobbyRooms.delete(lobbyId);
      return;
    }
  }

  // Удаляем игрока
  await db
    .delete(lobbyPlayers)
    .where(
      and(
        eq(lobbyPlayers.lobbyId, lobbyId),
        eq(lobbyPlayers.userId, userId)
      )
    );

  await db
    .update(lobbies)
    .set({ currentPlayers: lobby.currentPlayers - 1 })
    .where(eq(lobbies.id, lobbyId));

  // Удаляем из комнаты
  playerConnections.delete(socket.id);
  const room = lobbyRooms.get(lobbyId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) {
      lobbyRooms.delete(lobbyId);
    }
  }

  io?.to(`lobby:${lobbyId}`).emit('lobby:player-left', {
    lobbyId,
    playerId: userId,
  });

  const updatedLobby = await getLobbyWithPlayers(lobbyId);
  if (updatedLobby) {
    io?.to(`lobby:${lobbyId}`).emit('lobby:update', { lobby: updatedLobby });
  }
}

function handlePlayerDisconnect(connectionId: string, lobbyId: string, userId: string) {
  playerConnections.delete(connectionId);
  const room = lobbyRooms.get(lobbyId);
  if (room) {
    room.delete(connectionId);
    if (room.size === 0) {
      lobbyRooms.delete(lobbyId);
    }
  }
}

function startCountdown(socket: { id: string }, lobbyId: string, hostId: string) {
  let seconds = 5;

  // Обновляем статус лобби
  db.update(lobbies)
    .set({ status: 'countdown' })
    .where(eq(lobbies.id, lobbyId))
    .catch(console.error);

  io?.to(`lobby:${lobbyId}`).emit('lobby:countdown', {
    lobbyId,
    seconds,
  });

  const interval = setInterval(() => {
    seconds--;

    if (seconds > 0) {
      io?.to(`lobby:${lobbyId}`).emit('lobby:countdown', {
        lobbyId,
        seconds,
      });
    } else {
      clearInterval(interval);
      startGame(socket, lobbyId, hostId);
    }
  }, 1000);
}

async function startGame(socket: { id: string }, lobbyId: string, hostId: string) {
  // Обновляем статус лобби
  await db
    .update(lobbies)
    .set({ 
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    })
    .where(eq(lobbies.id, lobbyId));

  // TODO: Создать игровую сессию
  // Пока используем заглушку
  const sessionId = `session_${Date.now()}`;

  io?.to(`lobby:${lobbyId}`).emit('lobby:start-game', {
    lobbyId,
    sessionId,
  });
}

function startInactivePlayerChecker() {
  setInterval(async () => {
    const now = new Date();
    const timeout = new Date(now.getTime() - HEARTBEAT_TIMEOUT);

    const inactivePlayers = await db
      .select()
      .from(lobbyPlayers)
      .where(isNull(lobbyPlayers.lastHeartbeat));

    for (const player of inactivePlayers) {
      const [lobby] = await db
        .select()
        .from(lobbies)
        .where(eq(lobbies.id, player.lobbyId))
        .limit(1);

      if (lobby) {
        await handlePlayerLeave(
          { id: player.connectionId || '' },
          player.lobbyId,
          player.userId
        );
        console.log(`🚪 [Socket] Kicked inactive player: ${player.userId} from lobby ${player.lobbyId}`);
      }
    }
  }, 60000); // Проверка каждую минуту
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
