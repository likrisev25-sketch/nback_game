'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            🧠 О игре
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Научно обоснованный тренажёр для развития памяти
          </p>
        </div>

        {/* Что такое N-back */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">
            Что такое N-back?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            <strong>N-back</strong> — это научно подтверждённый тренажёр для развития рабочей памяти и когнитивных способностей. 
            Исследования показывают, что регулярные тренировки N-back улучшают подвижный интеллект, концентрацию и способность к многозадачности.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-blue-800 dark:text-blue-200 italic">
              📚 Многочисленные исследования подтверждают эффективность N-back для когнитивного развития
            </p>
          </div>
        </div>

        {/* Как работает тренажёр */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-purple-600 dark:text-purple-400">
            Как работает наш тренажёр?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
            Перед вами появляется последовательность позиций в сетке <strong>3×3</strong>. 
            Ваша задача — запоминать их и сравнивать текущую позицию с той, что была <strong>N шагов назад</strong>.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Например, при <strong>N=1</strong> нужно сравнивать каждую позицию с предыдущей. 
            При <strong>N=2</strong> — с позапрошлой, и так далее.
          </p>
        </div>

        {/* Особенности */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
            Что делает наш тренажёр особенным?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl">
              <div className="text-4xl mb-3">🎮</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Соревновательный режим</h3>
              <p className="text-gray-700 dark:text-gray-300">Играйте с друзьями или случайными соперниками</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Механика влияния ошибок</h3>
              <p className="text-gray-700 dark:text-gray-300">Каждая ошибка ускоряет игру для всех</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Умные боты</h3>
              <p className="text-gray-700 dark:text-gray-300">Настраивайте сложность, тренируйтесь в одиночку</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-xl">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Турниры</h3>
              <p className="text-gray-700 dark:text-gray-300">Соревнуйтесь с несколькими игроками в формате плей-офф</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-6 rounded-xl md:col-span-2">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Статистика</h3>
              <p className="text-gray-700 dark:text-gray-300">Отслеживайте прогресс, смотрите историю игр</p>
            </div>
          </div>
        </div>

        {/* Для кого этот тренажёр */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
            Для кого этот тренажёр?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎓</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Студентам</h3>
                <p className="text-gray-700 dark:text-gray-300">Для улучшения успеваемости</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">💼</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Профессионалам</h3>
                <p className="text-gray-700 dark:text-gray-300">Для повышения продуктивности</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">👴</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Пожилым людям</h3>
                <p className="text-gray-700 dark:text-gray-300">Для поддержания когнитивного здоровья</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎮</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Геймерам</h3>
                <p className="text-gray-700 dark:text-gray-300">Для соревновательной тренировки мозга</p>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки навигации */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/how-to-play"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            📖 Как играть
          </Link>
          <Link
            href="/training"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg"
          >
            🏋️ Тренировка
          </Link>
          <Link
            href="/tournament"
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-bold text-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
          >
            🏆 Турниры
          </Link>
        </div>
      </div>
    </div>
  );
}
