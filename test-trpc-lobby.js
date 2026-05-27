/**
 * Тестовый скрипт для проверки tRPC lobby endpoints
 * Запуск: node test-trpc-lobby.js
 */

const API_URL = 'http://localhost:3000/api/trpc';

async function testListLobbies() {
  console.log('🔵 Тест: listLobbies');
  try {
    const response = await fetch(`${API_URL}/lobby.listLobbies`);
    const data = await response.json();
    console.log('✅ listLobbies:', data);
    return data;
  } catch (error) {
    console.error('❌ listLobbies error:', error);
    return null;
  }
}

async function testCreateLobby() {
  console.log('\n🔵 Тест: createLobby');
  try {
    const input = {
      gameId: 'default',
      name: 'Тестовое лобби',
      nValue: 2,
      baseSpeedMs: 2000,
      maxPlayers: 4,
    };
    const inputEncoded = encodeURIComponent(JSON.stringify(input));
    const response = await fetch(`${API_URL}/lobby.createLobby?input=${inputEncoded}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ createLobby:', data);
    return data;
  } catch (error) {
    console.error('❌ createLobby error:', error);
    return null;
  }
}

async function testJoinLobby(lobbyId) {
  console.log(`\n🔵 Тест: joinLobby (${lobbyId})`);
  try {
    const input = { lobbyId: lobbyId };
    const inputEncoded = encodeURIComponent(JSON.stringify(input));
    const response = await fetch(`${API_URL}/lobby.joinLobby?input=${inputEncoded}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log('✅ joinLobby:', data);
    return data;
  } catch (error) {
    console.error('❌ joinLobby error:', error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Запуск тестов tRPC lobby endpoints...\n');
  
  // Тест 1: Получение списка лобби
  const listResult = await testListLobbies();
  
  // Тест 2: Создание лобби
  const createResult = await testCreateLobby();
  
  if (createResult && createResult.success) {
    // Тест 3: Присоединение к созданному лобби
    await testJoinLobby(createResult.lobbyId);
  }
  
  console.log('\n✅ Все тесты завершены!');
}

runTests().catch(console.error);