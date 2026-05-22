'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TournamentInfoPage() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nValue: 2,
    totalSteps: 30,
    baseSpeedMs: 2000,
    maxParticipants: 4,
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Введите название турнира!');
      return;
    }
    
    // Переход на страницу создания турнира
    router.push(`/tournament/create?name=${encodeURIComponent(formData.name)}&nValue=${formData.nValue}`);
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Создать турнир
            </h1>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Название турнира</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  placeholder="Мой турнир"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Уровень N</label>
                  <select
                    value={formData.nValue}
                    onChange={(e) => setFormData({ ...formData, nValue: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={1}>1 (Легко)</option>
                    <option value={2}>2 (Средне)</option>
                    <option value={3}>3 (Сложно)</option>
                    <option value={4}>4 (Очень сложно)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Участников</label>
                  <select
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={4}>4 игрока</option>
                    <option value={8}>8 игроков</option>
                    <option value={16}>16 игроков</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all"
                >
                  Создать
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            🏆 Турниры
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Соревнуйтесь с игроками в формате плей-офф
          </p>
        </div>

        {/* Что такое турнирный режим */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-orange-600 dark:text-orange-400">
            Что такое турнирный режим?
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Турнирный режим позволяет проводить соревнования между несколькими игроками (3+). 
            Это формат с <strong>выбыванием</strong>: победители проходят дальше, проигравшие выбывают.
          </p>
        </div>

        {/* Как участвовать */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-red-600 dark:text-red-400">
            Как участвовать в турнире?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">🎯 Создание турнира (для организатора):</h3>
              <ol className="space-y-2 text-gray-700 dark:text-gray-300 list-decimal list-inside">
                <li>Нажмите кнопку «Создать турнир»</li>
                <li>Укажите название, уровень N, количество шагов</li>
                <li>Выберите количество участников (4, 8 или 16)</li>
                <li>Дождитесь, пока игроки присоединятся</li>
                <li>Нажмите «Начать турнир»</li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">👥 Участие в турнире:</h3>
              <ol className="space-y-2 text-gray-700 dark:text-gray-300 list-decimal list-inside">
                <li>Найдите турнир в списке доступных</li>
                <li>Нажмите «Присоединиться»</li>
                <li>Дождитесь начала</li>
                <li>Играйте свои матчи по очереди</li>
                <li>Смотрите результаты в турнирной сетке</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Формат турнира */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-green-600 dark:text-green-400">
            Формат турнира
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <th className="p-4 text-left">Участников</th>
                  <th className="p-4 text-left">Формат</th>
                  <th className="p-4 text-left">Матчей на игрока</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b dark:border-gray-700">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">4</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Полуфинал → Финал</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">2 матча</td>
                </tr>
                <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <td className="p-4 font-bold text-gray-900 dark:text-white">8</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">1/4 → Полуфинал → Финал</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">3 матча</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-gray-900 dark:text-white rounded-bl-lg">16</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 rounded-br-lg">1/8 → 1/4 → Полуфинал → Финал</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 rounded-br-lg">4 матча</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Определение победителя */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 text-purple-600 dark:text-purple-400">
            Как определяется победитель матча?
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-2xl">🥇</span>
              <p className="text-gray-700 dark:text-gray-300"><strong>1.</strong> Игрок с БОЛЬШИМ количеством правильных ответов</p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-2xl">🥈</span>
              <p className="text-gray-700 dark:text-gray-300"><strong>2.</strong> При равенстве — побеждает тот, у кого МЕНЬШЕ ошибок</p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-2xl">🥉</span>
              <p className="text-gray-700 dark:text-gray-300"><strong>3.</strong> При полном равенстве — побеждает тот, кто был зарегистрирован раньше</p>
            </div>
          </div>
        </div>

        {/* Механика турнира */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h2 className="text-3xl font-bold mb-6">
            ⚡ Механика турнира
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold mb-1">Влияние ошибок</h3>
              <p className="text-sm text-white/80">Работает внутри матча — ошибки всех игроков ускоряют игру</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-3xl mb-2">🤖</div>
              <h3 className="font-bold mb-1">Боты в турнире</h3>
              <p className="text-sm text-white/80">Если не хватает игроков, можно добавить ботов</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-bold mb-1">Живая сетка</h3>
              <p className="text-sm text-white/80">Результаты обновляются автоматически после каждого матча</p>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-bold text-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
          >
            🏆 Создать турнир
          </button>
          <Link
            href="/"
            className="px-8 py-4 bg-gray-600 text-white rounded-full font-bold text-lg hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg text-center"
          >
            ← На главную
          </Link>
          <Link
            href="/about"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-center"
          >
            🧠 О игре
          </Link>
          <Link
            href="/how-to-play"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-bold text-lg hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-105 shadow-lg text-center"
          >
            📖 Как играть
          </Link>
          <Link
            href="/training"
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-full font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg text-center"
          >
            🏋️ Тренировка
          </Link>
        </div>
      </div>
    </div>
  );
}
