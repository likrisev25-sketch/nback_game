import { db } from '@/db/db';
import { gamePlayers, gameSessions } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import Link from 'next/link';

/**
 * Таблица лидеров
 * Показывает топ игроков по точности и количеству правильных ответов
 */

// Отключаем статическую генерацию для этой страницы
export const dynamic = 'force-dynamic';

/**
 * Тип игрока для leaderboard
 */
type LeaderboardPlayer = {
  userId: string | null;
  name: string | null;
  totalCorrect: number;
  totalErrors: number;
  totalGames: number;
  avgNValue: number | null;
};

export default async function LeaderboardPage() {
  // Получаем топ игроков по точности (минимум 5 игр)
  const topPlayersByAccuracy: LeaderboardPlayer[] = await db
    .select({
      userId: gamePlayers.userId,
      name: gamePlayers.name,
      totalCorrect: sql<number>`SUM(${gamePlayers.correctAnswers})`.mapWith(Number),
      totalErrors: sql<number>`SUM(${gamePlayers.errors})`.mapWith(Number),
      totalGames: sql<number>`COUNT(*)`.mapWith(Number),
      avgNValue: sql<number>`AVG(${gameSessions.nValue})`.mapWith(Number),
    })
    .from(gamePlayers)
    .leftJoin(gameSessions, eq(gamePlayers.sessionId, gameSessions.id))
    .where(sql`${gamePlayers.isBot} = 0`)
    .groupBy(gamePlayers.userId, gamePlayers.name)
    .having(sql`COUNT(*) >= 5`)
    .orderBy(
      desc(
        sql`SUM(${gamePlayers.correctAnswers}) / NULLIF(SUM(${gamePlayers.correctAnswers} + ${gamePlayers.errors}), 0)`
      )
    )
    .limit(50);

  // Получаем топ игроков по количеству правильных ответов
  const topPlayersByScore: LeaderboardPlayer[] = await db
    .select({
      userId: gamePlayers.userId,
      name: gamePlayers.name,
      totalCorrect: sql<number>`SUM(${gamePlayers.correctAnswers})`.mapWith(Number),
      totalErrors: sql<number>`SUM(${gamePlayers.errors})`.mapWith(Number),
      totalGames: sql<number>`COUNT(*)`.mapWith(Number),
      avgNValue: sql<number>`AVG(${gameSessions.nValue})`.mapWith(Number),
    })
    .from(gamePlayers)
    .leftJoin(gameSessions, eq(gamePlayers.sessionId, gameSessions.id))
    .where(sql`${gamePlayers.isBot} = 0`)
    .groupBy(gamePlayers.userId, gamePlayers.name)
    .having(sql`COUNT(*) >= 5`)
    .orderBy(desc(sql`SUM(${gamePlayers.correctAnswers})`))
    .limit(50);

  // Функция для расчёта точности
  const calculateAccuracy = (correct: number, errors: number): number => {
    if (correct + errors === 0) return 0;

    return Math.round((correct / (correct + errors)) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Таблица лидеров
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            Лучшие игроки N-Back Game
          </p>
        </div>

        {/* Топ по очкам */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            По количеству очков
          </h2>

          {topPlayersByScore.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Пока нет игроков с достаточным количеством игр
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      #
                    </th>

                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Игрок
                    </th>

                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Игр
                    </th>

                    <th className="text-center py-3 px-4 text-sm font-medium text-green-600">
                      Правильно
                    </th>

                    <th className="text-center py-3 px-4 text-sm font-medium text-red-600">
                      Ошибки
                    </th>

                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Точность
                    </th>

                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Средний N
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {topPlayersByScore.map(
                    (player: LeaderboardPlayer, index: number) => {
                      const accuracy = calculateAccuracy(
                        player.totalCorrect,
                        player.totalErrors
                      );

                      return (
                        <tr
                          key={player.userId ?? index}
                          className={`border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                            index < 3
                              ? 'bg-yellow-50 dark:bg-yellow-900/10'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                  ? 'bg-gray-300 text-gray-700'
                                  : index === 2
                                  ? 'bg-amber-600 text-amber-100'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {player.name ||
                              `Игрок ${player.userId?.slice(0, 8) ?? 'Unknown'}`}
                          </td>

                          <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">
                            {player.totalGames}
                          </td>

                          <td className="py-3 px-4 text-center text-green-600 font-medium">
                            {player.totalCorrect}
                          </td>

                          <td className="py-3 px-4 text-center text-red-600 font-medium">
                            {player.totalErrors}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                accuracy >= 80
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : accuracy >= 50
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {accuracy}%
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-300">
                            N={player.avgNValue?.toFixed(1) ?? '0.0'}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Топ по точности */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            По точности
          </h2>

          {topPlayersByAccuracy.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Пока нет игроков с достаточным количеством игр
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Игрок</th>
                    <th className="text-center py-3 px-4">Точность</th>
                    <th className="text-center py-3 px-4">Игр</th>
                  </tr>
                </thead>

                <tbody>
                  {topPlayersByAccuracy.map(
                    (player: LeaderboardPlayer, index: number) => {
                      const accuracy = calculateAccuracy(
                        player.totalCorrect,
                        player.totalErrors
                      );

                      return (
                        <tr
                          key={player.userId ?? index}
                          className="border-b border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-3 px-4 font-bold">
                            {index + 1}
                          </td>

                          <td className="py-3 px-4">
                            {player.name ||
                              `Игрок ${player.userId?.slice(0, 8) ?? 'Unknown'}`}
                          </td>

                          <td className="py-3 px-4 text-center font-medium">
                            {accuracy}%
                          </td>

                          <td className="py-3 px-4 text-center">
                            {player.totalGames}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Кнопка */}
        <div className="text-center">
          <Link
            href="/#play"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Начать играть и попасть в топ!
          </Link>
        </div>
      </div>
    </div>
  );
}