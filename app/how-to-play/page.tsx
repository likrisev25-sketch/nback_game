'use client';

import Link from 'next/link';

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            🎮 Как играть
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Полное руководство по игре в N-back
          </p>
        </div>

        {/* 1. Основная механика */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">
            1. Основная механика
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <th className="p-4 text-left rounded-tl-lg">Элемент</th>
                  <th className="p-4 text-left rounded-tr-lg">Описание</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Сетка 3×3</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">9 позиций, на которых появляются стимулы (подсветка ячейки)</td>
                </tr>
                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Кнопка «СОВПАДЕНИЕ!»</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Нажимайте, когда текущая позиция совпадает с позицией N шагов назад</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Индикатор N</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Показывает текущий уровень сложности (1, 2, 3, 4 или 5)</td>
                </tr>
                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Счётчик ответов</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Отображает количество правильных ответов</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">Счётчик ошибок</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Показывает количество ошибок (каждые 3 ошибки ускоряют игру)</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white rounded-bl-lg">Таймер/скорость</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 rounded-br-lg">Время между стимулами (уменьшается при ошибках)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Пошаговая инструкция */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-purple-600 dark:text-purple-400">
            2. Пошаговая инструкция
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Выберите режим</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Одиночная тренировка</strong> — играйте против бота или просто тренируйтесь</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Многопользовательский режим</strong> — создайте лобби или присоединитесь к игре (2–4 игрока)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    <span><strong>Турнир</strong> — участвуйте в соревновании с выбыванием</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Настройте параметры</h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• Уровень N (1–5)</li>
                  <li>• Количество раундов (10–100 шагов)</li>
                  <li>• Скорость (500–5000 мс)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Играйте!</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Следите за сеткой</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Нажимайте кнопку, когда видите совпадение с N шагов назад</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Не нажимайте, если совпадения нет (ложное нажатие = ошибка)</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Побеждайте</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">★</span>
                    <span>После окончания игры определяется победитель</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">★</span>
                    <span>Результаты сохраняются в вашу историю</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Механика ускорения */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl shadow-xl p-8 mb-8 border-2 border-red-200 dark:border-red-800">
          <h2 className="text-3xl font-bold mb-6 text-red-600 dark:text-red-400">
            ⚡ 3. Механика ускорения (важно!)
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-4">
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
{`Ошибка игрока 1 → +1 к его счётчику ошибок
Ошибка игрока 2 → +1 к его счётчику ошибок
Когда у ЛЮБОГО игрока набирается 3 ошибки → 
  скорость увеличивается ДЛЯ ВСЕХ на 10%`}
            </pre>
          </div>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-yellow-800 dark:text-yellow-200 italic">
              💡 Это создаёт напряжение: вы не только играете за себя, но и можете «подвести» команду, 
              делая игру сложнее для всех.
            </p>
          </div>
        </div>

        {/* 4. Советы для новичков */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
            💡 4. Советы для новичков
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Начинайте с N=1</strong>, это самый простой уровень
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Не торопитесь</strong> — лучше пропустить совпадение, чем нажать ложно
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Сосредоточьтесь</strong> на запоминании последних N позиций
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Делайте перерывы</strong> после 10–15 минут игры
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg md:col-span-2">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Тренируйтесь регулярно:</strong> 2–3 раза в день по 10 минут
              </p>
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
