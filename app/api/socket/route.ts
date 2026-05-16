import { NextRequest, NextResponse } from 'next/server';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initSocket } from '@/lib/socket-server';

// Глобальная переменная для хранения сервера Socket.IO
declare global {
  var __socketServer__: SocketIOServer | undefined;
  var __httpServer__: HTTPServer | undefined;
}

export async function GET(request: NextRequest) {
  // Если сервер уже инициализирован, возвращаем информацию о нём
  if (global.__socketServer__) {
    return NextResponse.json({
      status: 'active',
      clients: global.__socketServer__?.sockets.sockets.size || 0,
    });
  }

  // Инициализируем сервер при первом запросе
  if (!global.__httpServer__) {
    // Получаем HTTP сервер из Node.js
    const { createServer } = await import('http');
    global.__httpServer__ = createServer();

    // Инициализируем Socket.IO
    const io = initSocket(global.__httpServer__);

    if (!global.__socketServer__) {
      global.__socketServer__ = io;
    }

    // Запускаем сервер на порту 3001 (отдельный от Next.js)
    global.__httpServer__.listen(3001, () => {
      console.log('✅ [Socket] WebSocket server running on port 3001');
    });
  }

  return NextResponse.json({
    status: 'initializing',
  });
}

export const dynamic = 'force-dynamic';
