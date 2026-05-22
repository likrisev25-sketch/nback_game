'use client';

import Link from 'next/link';

export default function TrainingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            🏋️ Тренировка
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Одиночный режим для развития памяти
          </p>
        </div>

        {/* Одиночный режим */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">
            Одиночный режим
          </h2>
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Как это работает:</h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Вы играете против бота или просто на результат</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Все механики работают так же, как в многопользовательском режиме</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>Ваши результаты сохраняются и сравниваются с вашими же прошлыми играми</span>
            </li>
          </ul>
        </div>

        {/* Настройка тренировки */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-purple-600 dark:text-purple-400">
            Настройка тренировки
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                  <th className="p-4 text-left">Параметр</th>
                  <th className="p-4 text-left">Варианты</th>
                  <th className="p-4 text-left">Описание</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Уровень N</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">1, 2, 3, 4, 5</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Чем выше N, тем сложнее запоминать</td>
                </tr>
                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Длительность</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">10–100 шагов</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Количество стимулов в игре</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Базовая скорость</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">500–5000 мс</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Время показа одного стимула</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white rounded-bl-lg">Бот</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Вкл/Выкл</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 rounded-br-lg">Соревнуйтесь с ИИ</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Настройка бота */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
            Настройка бота
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Если вы включили бота, выберите его точность:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🤖</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">100%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Бог</h3>
              <p className="text-gray-700 dark:text-gray-300">Не ошибается никогда (для профи)</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🎯</span>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">90%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Эксперт</h3>
              <p className="text-gray-700 dark:text-gray-300">Ошибается редко</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👍</span>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">75%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Продвинутый</h3>
              <p className="text-gray-700 dark:text-gray-300">Ошибается иногда</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">😐</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">60%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Средний</h3>
              <p className="text-gray-700 dark:text-gray-300">Ошибается часто</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 p-6 rounded-xl md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🌱</span>
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">40%</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Новичок</h3>
              <p className="text-gray-700 dark:text-gray-300">Ошибается очень часто</p>
            </div>
          </div>
        </div>

        {/* Статистика тренировок */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
            Статистика тренировок
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            После каждой игры вы видите:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Правильные ответы</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Сколько раз вы нажали правильно</p>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Ошибки</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ложные нажатия или пропуски</p>
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Ускорения</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Сколько раз игра ускорялась</p>
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Место</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ваше место в сессии</p>
              </div>
            </div>
          </div>
        </div>

        {/* Рекомендации по тренировкам */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-6">
            📈 Рекомендации по тренировкам
          </h2>
          <div className="bg-white/10 rounded-xl p-6 font-mono text-sm">
            <div className="space-y-2">
              <p>День 1-3: N=1, 20 шагов, скорость 2000 мс</p>
              <p>День 4-7: N=2, 30 шагов, скорость 1500 мс</p>
              <p>День 8-14: N=3, 40 шагов, скорость 1200 мс</p>
              <p>День 15+: N=4 и выше, 50+ шагов, скорость 800+ мс</p>
            </div>
          </div>
        </div>

        {/* Кнопки навигации */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-gray-600 text-white rounded-full font-bold text-lg hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg"
          >
            ← На главную
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
          >
            🧠 О игре
          </Link>
          <Link
            href="/how-to-play"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-bold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg"
          >
            📖 Как играть
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
