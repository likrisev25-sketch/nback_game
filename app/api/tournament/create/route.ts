import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { gameSessions, gamePlayers, sequences, tournamentResults } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

interface CreateTournamentRequest {
  name: string;
  nValue: number;
  totalSteps: number;
  baseSpeedMs: number;
  maxRounds: number;
  addBot: boolean;
  botAccuracy: number; // 0-100
  botName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTournamentRequest = await request.json();
    const { name, nValue, totalSteps, baseSpeedMs, maxRounds, addBot, botAccuracy, botName } = body;

    const tournamentId = uuidv4();
    const now = new Date().toISOString();

    // Создаём первую сессию турнира
    const [session] = await db
      .insert(gameSessions)
      .values({
        id: uuidv4(),
        name: `${name} - Раунд 1`,
        nValue,
        baseSpeedMs,
        currentSpeedMs: baseSpeedMs,
        maxPlayers: 2,
        status: 'waiting',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Генерируем последовательность
    const positions: number[] = [];
    for (let i = 0; i < totalSteps; i++) {
      if (i >= nValue && Math.random() < 0.3) {
        positions.push(positions[i - nValue]);
      } else {
        positions.push(Math.floor(Math.random() * 9));
      }
    }

    await db.insert(sequences).values({
      id: uuidv4(),
      sessionId: session.id,
      positions: JSON.stringify(positions),
      totalSteps,
      createdAt: now,
    });

    // Добавляем игрока (человека)
    const [player] = await db.insert(gamePlayers).values({
      id: uuidv4(),
      sessionId: session.id,
      userId: uuidv4(),
      correctAnswers: 0,
      errors: 0,
      isBot: false,
      joinedAt: now,
    }).returning();

    // Добавляем бота и создаем запись в tournamentResults
    let botId: string | null = null;
    let botPlayerId: string | null = null;
    
    if (addBot) {
      const [bot] = await db.insert(gamePlayers).values({
        id: uuidv4(),
        sessionId: session.id,
        userId: uuidv4(),
        correctAnswers: 0,
        errors: 0,
        isBot: true,
        botAccuracy,
        joinedAt: now,
      }).returning();
      
      botId = bot.id;
      botPlayerId = bot.id;

      // Создаем начальную запись в tournamentResults для бота
      await db.insert(tournamentResults).values({
        id: uuidv4(),
        tournamentId,
        playerId: bot.id,
        isBot: true,
        botAccuracy,
        totalCorrect: 0,
        totalErrors: 0,
        roundWins: 0,
        createdAt: now,
      });
    }

    // Создаем начальную запись в tournamentResults для игрока
    await db.insert(tournamentResults).values({
      id: uuidv4(),
      tournamentId,
      playerId: player.id,
      isBot: false,
      botAccuracy: null,
      totalCorrect: 0,
      totalErrors: 0,
      roundWins: 0,
      createdAt: now,
    });

    const tournament = {
      id: tournamentId,
      name,
      nValue,
      totalSteps,
      baseSpeedMs,
      maxRounds,
      currentRound: 1,
      status: 'waiting',
      createdAt: now,
    };

    // Сохраняем в sessionStorage (клиент прочитает это)
    const playersData = [
      { 
        id: player.id, 
        tournamentId, 
        userId: player.userId, 
        totalCorrectAnswers: 0, 
        totalErrors: 0, 
        roundWins: 0, 
        isBot: false, 
        joinedAt: now 
      },
      ...(addBot && botId ? [{ 
        id: botId, 
        tournamentId, 
        userId: uuidv4(), 
        totalCorrectAnswers: 0, 
        totalErrors: 0, 
        roundWins: 0, 
        isBot: true, 
        botAccuracy: botAccuracy || 80, 
        name: botName || `Bot-${botAccuracy}%`,
        joinedAt: now 
      }] : []),
    ];

    return NextResponse.json({
      success: true,
      tournament,
      sessionId: session.id,
      playerId: player.id,
      players: playersData,
      currentRound: 1,
    });
  } catch (error) {
    console.error('Ошибка создания турнира:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

