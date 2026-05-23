// Тестовый скрипт для проверки создания лобби
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

async function testCreateLobby() {
  console.log('🔵 Тест создания лобби...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/lobby/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'default',
        name: 'Тестовое лобби',
        nValue: 2,
        baseSpeedMs: 2000,
        minPlayers: 2,
        maxPlayers: 2,
        userName: 'Тест Игрок',
        addBot: true,
        botAccuracy: 80,
        botName: 'Тест Бот'
      }),
    });
    
    console.log('Статус ответа:', response.status);
    
    const data = await response.json();
    console.log('Ответ:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Лобби успешно создано!');
      console.log('ID лобби:', data.lobby.id);
      console.log('Игроки:', data.lobby.players.map(p => p.name).join(', '));
    } else {
      console.log('\n❌ Ошибка создания лобби:', data.error);
    }
  } catch (error) {
    console.error('❌ Исключение:', error.message);
  }
}

async function testListLobbies() {
  console.log('\n🔵 Тест списка лобби...\n');
  
  try {
    const response = await fetch(`${API_URL}/api/lobby/list`);
    console.log('Статус ответа:', response.status);
    
    const data = await response.json();
    console.log('Ответ:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Список лобби получен!');
      console.log('Количество лобби:', data.lobbies.length);
      data.lobbies.forEach(lobby => {
        console.log(`  - ${lobby.name}: ${lobby.currentPlayers}/${lobby.maxPlayers} игроков`);
      });
    } else {
      console.log('\n❌ Ошибка получения списка:', data.error);
    }
  } catch (error) {
    console.error('❌ Исключение:', error.message);
  }
}

// Запускаем тесты
testCreateLobby().then(() => {
  setTimeout(testListLobbies, 1000);
});
