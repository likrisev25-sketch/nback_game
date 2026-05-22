import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 [list/route] Получение списка игр...');
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // Получаем только активные сессии в статусе "waiting" (ожидают игроков)
    console.log('📋 [list/route] Запрос к БД...');
    const sessions = await db.query.gameSessions.findMany({
      where: eq(gameSessions.status, 'waiting'),
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
    });

    console.log('📋 [list/route] Найдено сессий:', sessions.length);

    // Преобразуем данные в удобной форме
    const games = await Promise.all(sessions.map(async (session: typeof gameSessions.$inferSelect) => {
      // Получаем игроков для каждой сессии отдельно
      const players = db ? await db.query.gamePlayers.findMany({
        where: eq(gamePlayers.sessionId, session.id),
      }) : [];
      
      const playerCount = players.length;
      const maxPlayers = session.maxPlayers;

      console.log('📋 [list/route] Игра:', {
        id: session.id,
        name: session.name,
        maxPlayers,
        playerCount,
      });

      return {
        id: session.id,
        name: session.name,
        nValue: session.nValue,
        maxPlayers,
        playerCount,
        canJoin: playerCount < maxPlayers,
        createdAt: session.createdAt,
      };
    }));

    console.log('📋 [list/route] Возвращаем игры:', games.length);
    return NextResponse.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('❌ [list/route] Ошибка получения списка игр:', error);
    console.error('❌ [list/route] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
