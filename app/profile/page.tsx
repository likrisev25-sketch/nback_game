import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getSession } from '@/lib/session';
import { db } from '@/db/db';
import { gamePlayers, gameSessions } from '@/db/schema';

import { eq, desc } from 'drizzle-orm';

/**
 * Страница профиля пользователя
 * Показывает статистику игр и историю
 */

export const dynamic = 'force-dynamic';

/**
 * Тип игры пользователя
 */
type UserGame = {
  sessionId: string;
  playerName: string | null;
  correctAnswers: number;
  errors: number;
  nValue: number | null;
  gameName: string | null;
  createdAt: Date | string;
  isBot: boolean | null;
};

export default async function ProfilePage() {
  const session = await getSession();

  // Редирект если не авторизован
  if (!session?.user) {
    redirect('/');
  }

  // Получаем историю игр пользователя
  const gameHistory: UserGame[] = await db
    .select({
      sessionId: gamePlayers.sessionId,
      playerName: gamePlayers.name,
      correctAnswers: gamePlayers.correctAnswers,
      errors: gamePlayers.errors,
      nValue: gameSessions.nValue,
      gameName: gameSessions.name,
      createdAt: gamePlayers.joinedAt,
      isBot: gamePlayers.isBot,
    })
    .from(gamePlayers)
    .leftJoin(
      gameSessions,
      eq(gamePlayers.sessionId, gameSessions.id)
    )
    .where(eq(gamePlayers.userId, session.user.id))
    .orderBy(desc(gamePlayers.joinedAt))
    .limit(50);

  // Фильтруем ботов
  const userGames = gameHistory.filter(
    (g: UserGame) => !g.isBot
  );

  // Общая статистика
  const totalGames = userGames.length;

  const totalCorrect = userGames.reduce(
    (sum: number, g: UserGame) =>
      sum + (g.correctAnswers || 0),
    0
  );

  const totalErrors = userGames.reduce(
    (sum: number, g: UserGame) =>
      sum + (g.errors || 0),
    0
  );

  const accuracy =
    totalCorrect + totalErrors > 0
      ? Math.round(
          (totalCorrect /
            (totalCorrect + totalErrors)) *
            100
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Профиль игрока
          </h1>

          <p className="text-gray-600 dark:text-gray-400">
            {session.user.email}
          </p>
        </div>

        {/* Карточка профиля */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {(
                session.user.name ||
                session.user.email?.[0] ||
                'U'
              ).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {session.user.name ||
                  'Пользователь'}
              </h2>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                Регистрация:{' '}
                {new Date(
                  session.user.createdAt ||
                    Date.now()
                ).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {totalGames}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Игр сыграно
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalCorrect}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Правильных ответов
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {totalErrors}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Ошибок
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {accuracy}%
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Точность
              </div>
            </div>
          </div>
        </div>

        {/* История игр */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            История игр
          </h3>

          {userGames.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Вы ещё не сыграли ни одной игры
              </p>

              <Link
                href="/#play"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Начать играть
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">
                      Дата
                    </th>

                    <th className="text-left py-3 px-4">
                      Игра
                    </th>

                    <th className="text-center py-3 px-4">
                      N
                    </th>

                    <th className="text-center py-3 px-4 text-green-600">
                      ✓
                    </th>

                    <th className="text-center py-3 px-4 text-red-600">
                      ✗
                    </th>

                    <th className="text-center py-3 px-4">
                      Точность
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {userGames.map(
                    (
                      game: UserGame,
                      index: number
                    ) => {
                      const gameAccuracy =
                        game.correctAnswers +
                          game.errors >
                        0
                          ? Math.round(
                              (game.correctAnswers /
                                (game.correctAnswers +
                                  game.errors)) *
                                100
                            )
                          : 0;

                      return (
                        <tr
                          key={`${game.sessionId}-${index}`}
                          className="border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                            {new Date(
                              game.createdAt
                            ).toLocaleDateString(
                              'ru-RU',
                              {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </td>

                          <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                            {game.gameName ||
                              'Быстрая игра'}
                          </td>

                          <td className="py-3 px-4 text-sm text-center text-gray-600 dark:text-gray-300">
                            N={game.nValue}
                          </td>

                          <td className="py-3 px-4 text-sm text-center text-green-600 font-medium">
                            {game.correctAnswers}
                          </td>

                          <td className="py-3 px-4 text-sm text-center text-red-600 font-medium">
                            {game.errors}
                          </td>

                          <td className="py-3 px-4 text-sm text-center">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                gameAccuracy >= 80
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : gameAccuracy >= 50
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {gameAccuracy}%
                            </span>
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
      </div>
    </div>
  );
}