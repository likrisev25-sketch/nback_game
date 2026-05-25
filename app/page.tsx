'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { SimpleLobby } from '@/components/game/SimpleLobby';

export default function Home() {
  const { data: session, isLoading } = useSession();
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Если не авторизован и не загружено, показываем приветственную страницу
    if (!isLoading && !session) {
      setShowAuth(true);
    }
  }, [session, isLoading]);

  // Пока загружается сессия
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован - показываем приветственную страницу
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Заголовок */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              N-Back Game
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Тренажёр рабочей памяти и внимания. Улучшите свои когнитивные способности с помощью научной методики N-Back.
            </p>
          </div>

          {/* Карточки преимуществ */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Улучшите память
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Регулярные тренировки N-Back доказано улучшают рабочую память
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Мультиплеер
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Играйте с друзьями в реальном времени и соревнуйтесь
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Отслеживайте прогресс
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Следите за своими результатами и улучшайте показатели
              </p>
            </div>
          </div>

          {/* Кнопки входа */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Войти
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Зарегистрироваться
            </Link>
          </div>

          {/* Дополнительная информация */}
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Уже есть аккаунт? <Link href="/login" className="text-blue-600 hover:text-blue-700">Войдите</Link></p>
          </div>
        </div>
      </div>
    );
  }

  // Авторизован - показываем игру
  return <SimpleLobby />;
}
