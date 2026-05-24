import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { db } from '@/db/db';
import { lobbies, lobbyPlayers, tournaments, tournamentPlayers, gameSessions, gamePlayers } from '@/db/schema';
import { eq, and, not, isNull } from 'drizzle-orm';
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
const tournamentRooms = new Map<string, Set<string>>(); // tournamentId -> Set<connectionId>

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
            isBot: false,
            botAccuracy: 100,
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
            player: updatedLobby.players.find((p: LobbyPlayer) => p.userId === userId),
          });

          // Проверяем автозапуск когда все места заняты
          if (updatedLobby.autoStartEnabled && 
              updatedLobby.currentPlayers >= updatedLobby.maxPlayers && 
              updatedLobby.status === 'waiting') {
            // Все места заняты и автозапуск включен - запускаем игру
            const hostPlayer = updatedLobby.players.find((p: LobbyPlayer) => p.userId === updatedLobby.hostId);
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
          const allReady = updatedLobby.players.every((p: LobbyPlayer) => p.isReady);
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
        const allReady = players.every((p: typeof lobbyPlayers.$inferSelect) => p.isReady);
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
          
          const allReady = players.every((p: typeof lobbyPlayers.$inferSelect) => p.isReady);
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

    // ============================================
    // TOURNAMENT EVENTS
    // ============================================

    // Присоединение к турниру
    socket.on('tournament:join', async (data: { tournamentId: string; userId: string; name: string }) => {
      try {
        const { tournamentId, userId, name } = data;

        // Проверяем существование турнира
        const [tournament] = await db
          .select()
          .from(tournaments)
          .where(eq(tournaments.id, tournamentId))
          .limit(1);

        if (!tournament) {
          socket.emit('tournament:error', { message: 'Турнир не найден' });
          return;
        }

        // Проверяем статус
        if (tournament.status !== 'waiting') {
          socket.emit('tournament:error', { message: 'Турнир уже начался или завершен' });
          return;
        }

        // Проверяем количество игроков
        const existingPlayers = await db
          .select()
          .from(tournamentPlayers)
          .where(eq(tournamentPlayers.tournamentId, tournamentId));

        if (existingPlayers.length >= tournament.maxPlayers) {
          socket.emit('tournament:error', { message: 'Турнир заполнен' });
          return;
        }

        // Проверяем не зарегистрирован ли уже игрок
        const existingPlayer = await db
          .select()
          .from(tournamentPlayers)
          .where(
            and(
              eq(tournamentPlayers.tournamentId, tournamentId),
              eq(tournamentPlayers.userId, userId)
            )
          )
          .limit(1);

        if (existingPlayer.length === 0) {
          // Добавляем игрока в турнир
          const isHost = tournament.hostId === userId;
          await db.insert(tournamentPlayers).values({
            id: nanoid(),
            tournamentId,
            userId,
            name,
            isReady: false,
            isHost,
            joinedAt: new Date().toISOString(),
          });

          // Обновляем счетчик игроков (добавим поле currentPlayers если его нет)
          await db
            .update(tournaments)
            .set({
              currentPlayers: tournament.currentPlayers + 1,
            })
            .where(eq(tournaments.id, tournamentId));
        }

        // Присоединяемся к комнате турнира
        socket.join(`tournament:${tournamentId}`);

        // Добавляем в комнату
        if (!tournamentRooms.has(tournamentId)) {
          tournamentRooms.set(tournamentId, new Set());
        }
        tournamentRooms.get(tournamentId)!.add(socket.id);

        // Получаем обновлённое состояние турнира
        const updatedTournament = await getTournamentWithPlayers(tournamentId);
        if (updatedTournament) {
          socket.emit('tournament:update', { tournament: updatedTournament });
          
          // Уведомляем других игроков
          socket.to(`tournament:${tournamentId}`).emit('tournament:player-joined', {
            player: updatedTournament.players.find((p) => p.userId === userId),
          });
        }
      } catch (error) {
        console.error('[Socket] Error joining tournament:', error);
        socket.emit('tournament:error', { message: 'Ошибка при присоединении к турниру' });
      }
    });

    // Выход из турнира
    socket.on('tournament:leave', async (data: { tournamentId: string; userId: string }) => {
      try {
        const { tournamentId, userId } = data;
        await handleTournamentPlayerLeave(socket, tournamentId, userId);
      } catch (error) {
        console.error('[Socket] Error leaving tournament:', error);
        socket.emit('tournament:error', { message: 'Ошибка при выходе из турнира' });
      }
    });

    // Обновление статуса готовности
    socket.on('tournament:ready', async (data: { tournamentId: string; userId: string; isReady: boolean }) => {
      try {
        const { tournamentId, userId, isReady } = data;

        await db
          .update(tournamentPlayers)
          .set({ isReady })
          .where(
            and(
              eq(tournamentPlayers.tournamentId, tournamentId),
              eq(tournamentPlayers.userId, userId)
            )
          );

        const updatedTournament = await getTournamentWithPlayers(tournamentId);
        if (updatedTournament) {
          io?.to(`tournament:${tournamentId}`).emit('tournament:player-ready', {
            tournamentId,
            playerId: userId,
            isReady,
          });

          // Проверяем готовы ли все игроки
          const allReady = updatedTournament.players.every((p) => p.isReady);
          if (allReady && updatedTournament.status === 'waiting' && updatedTournament.currentPlayers >= updatedTournament.minPlayers) {
            // Все готовы и достаточно игроков - запускаем обратный отсчет
            startTournamentCountdown(socket, tournamentId, updatedTournament.hostId);
          }
        }
      } catch (error) {
        console.error('[Socket] Error updating tournament ready status:', error);
      }
    });

    // Запуск турнира (только host)
    socket.on('tournament:start', async (data: { tournamentId: string; hostId: string }) => {
      try {
        const { tournamentId, hostId } = data;

        const [tournament] = await db
          .select()
          .from(tournaments)
          .where(eq(tournaments.id, tournamentId))
          .limit(1);

        if (!tournament) {
          socket.emit('tournament:error', { message: 'Турнир не найден' });
          return;
        }

        if (tournament.hostId !== hostId) {
          socket.emit('tournament:error', { message: 'Только хост может запустить турнир' });
          return;
        }

        // Проверяем количество игроков
        const players = await db
          .select()
          .from(tournamentPlayers)
          .where(eq(tournamentPlayers.tournamentId, tournamentId));

        if (players.length < tournament.minPlayers) {
          socket.emit('tournament:error', { 
            message: `Недостаточно игроков. Нужно минимум ${tournament.minPlayers}, сейчас ${players.length}`
          });
          return;
        }

        // Проверяем что все игроки готовы
        const allReady = players.every((p) => p.isReady);
        if (!allReady) {
          socket.emit('tournament:error', { message: 'Не все игроки готовы' });
          return;
        }

        startTournamentCountdown(socket, tournamentId, hostId);
      } catch (error) {
        console.error('[Socket] Error starting tournament:', error);
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
    players: players.map((p: typeof lobbyPlayers.$inferSelect) => ({
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
  console.log('🎮 [Socket] Starting game for lobby:', lobbyId);

  // Получаем лобби с игроками
  const [lobby] = await db
    .select()
    .from(lobbies)
    .where(eq(lobbies.id, lobbyId))
    .limit(1);

  if (!lobby) {
    console.error('❌ [Socket] Lobby not found:', lobbyId);
    return;
  }

  const players = await db
    .select()
    .from(lobbyPlayers)
    .where(eq(lobbyPlayers.lobbyId, lobbyId));

  // Создаем игровую сессию
  const sessionId = nanoid();
  const now = new Date().toISOString();

  await db.insert(gameSessions).values({
    id: sessionId,
    name: lobby.name,
    nValue: lobby.nValue,
    baseSpeedMs: lobby.baseSpeedMs,
    currentSpeedMs: lobby.baseSpeedMs,
    maxPlayers: lobby.maxPlayers,
    status: 'playing',
    createdAt: now,
    updatedAt: now,
  });

  console.log('✅ [Socket] Created game session:', sessionId);

  // Добавляем игроков в game_players
  for (const player of players) {
    await db.insert(gamePlayers).values({
      id: nanoid(),
      sessionId,
      userId: player.userId,
      name: player.name,
      correctAnswers: 0,
      errors: 0,
      isBot: player.isBot || false,
      botAccuracy: player.botAccuracy || 100,
      isHost: player.isHost || false,
      joinedAt: now,
    });
  }

  console.log('✅ [Socket] Added players to game session');

  // Обновляем статус лобби
  await db
    .update(lobbies)
    .set({ 
      status: 'in_progress',
      startedAt: now,
    })
    .where(eq(lobbies.id, lobbyId));

  // Отправляем всем игрокам sessionId
  io?.to(`lobby:${lobbyId}`).emit('lobby:start-game', {
    lobbyId,
    sessionId,
  });

  console.log('✅ [Socket] Game started, sessionId:', sessionId);
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

// ============================================
// TOURNAMENT HELPER FUNCTIONS
// ============================================

async function getTournamentWithPlayers(tournamentId: string): Promise<any | null> {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) return null;

  const players = await db
    .select()
    .from(tournamentPlayers)
    .where(eq(tournamentPlayers.tournamentId, tournamentId));

  return {
    ...tournament,
    players,
  };
}

async function handleTournamentPlayerLeave(socket: { id: string }, tournamentId: string, userId: string) {
  const [player] = await db
    .select()
    .from(tournamentPlayers)
    .where(
      and(
        eq(tournamentPlayers.tournamentId, tournamentId),
        eq(tournamentPlayers.userId, userId)
      )
    )
    .limit(1);

  if (!player) return;

  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);

  if (!tournament) return;

  // Если хост вышел - передаем права
  if (player.isHost) {
    const otherPlayers = await db
      .select()
      .from(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournamentId, tournamentId),
          not(eq(tournamentPlayers.userId, userId))
        )
      )
      .orderBy(tournamentPlayers.joinedAt)
      .limit(1);

    if (otherPlayers.length > 0) {
      const newHost = otherPlayers[0];
      await db
        .update(tournamentPlayers)
        .set({ isHost: true })
        .where(eq(tournamentPlayers.id, newHost.id));

      io?.to(`tournament:${tournamentId}`).emit('tournament:host-transferred', {
        tournamentId,
        newHostId: newHost.userId,
      });
    } else {
      // Если больше никого нет - удаляем турнир
      await db.delete(tournaments).where(eq(tournaments.id, tournamentId));
      tournamentRooms.delete(tournamentId);
      return;
    }
  }

  // Удаляем игрока
  await db
    .delete(tournamentPlayers)
    .where(
      and(
        eq(tournamentPlayers.tournamentId, tournamentId),
        eq(tournamentPlayers.userId, userId)
      )
    );

  await db
    .update(tournaments)
    .set({ currentPlayers: tournament.currentPlayers - 1 })
    .where(eq(tournaments.id, tournamentId));

  // Удаляем из комнаты
  const room = tournamentRooms.get(tournamentId);
  if (room) {
    room.delete(socket.id);
    if (room.size === 0) {
      tournamentRooms.delete(tournamentId);
    }
  }

  io?.to(`tournament:${tournamentId}`).emit('tournament:player-left', {
    tournamentId,
    playerId: userId,
  });

  const updatedTournament = await getTournamentWithPlayers(tournamentId);
  if (updatedTournament) {
    io?.to(`tournament:${tournamentId}`).emit('tournament:update', { tournament: updatedTournament });
  }
}

function startTournamentCountdown(socket: { id: string }, tournamentId: string, hostId: string) {
  let seconds = 5;

  // Обновляем статус турнира
  db.update(tournaments)
    .set({ status: 'playing' })
    .where(eq(tournaments.id, tournamentId))
    .catch(console.error);

  io?.to(`tournament:${tournamentId}`).emit('tournament:countdown', {
    seconds,
  });

  const interval = setInterval(() => {
    seconds--;

    if (seconds > 0) {
      io?.to(`tournament:${tournamentId}`).emit('tournament:countdown', {
        seconds,
      });
    } else {
      clearInterval(interval);
      startTournamentGame(socket, tournamentId, hostId);
    }
  }, 1000);
}

async function startTournamentGame(socket: { id: string }, tournamentId: string, hostId: string) {
  // Обновляем статус турнира
  await db
    .update(tournaments)
    .set({ 
      status: 'playing',
      startedAt: new Date().toISOString(),
    })
    .where(eq(tournaments.id, tournamentId));

  // Создаем игровую сессию для первого раунда
  const sessionId = `tournament_${tournamentId}_round_1_${Date.now()}`;

  io?.to(`tournament:${tournamentId}`).emit('tournament:start-game', {
    sessionId,
  });
}
