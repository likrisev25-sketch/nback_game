// Простая аутентификация без сторонних библиотек
// Для локальной разработки и тестирования

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  
  let userId = localStorage.getItem('temp_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('temp_user_id', userId);
  }
  return userId;
}

export function getUserName(): string {
  if (typeof window === 'undefined') return 'Игрок';
  
  let name = localStorage.getItem('temp_user_name');
  if (!name) {
    name = 'Игрок_' + Math.floor(Math.random() * 1000);
    localStorage.setItem('temp_user_name', name);
  }
  return name;
}

export function setUserName(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('temp_user_name', name);
  }
}
