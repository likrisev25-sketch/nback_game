import { NextRequest, NextResponse } from 'next/server';

// Временная заглушка для аутентификации
export async function GET(request: NextRequest) {
  console.log('⚠️  [auth] GET request - Auth disabled');
  return NextResponse.json({ 
    message: 'Authentication temporarily disabled for demo',
    user: { id: 'demo-user', email: 'demo@example.com', name: 'Demo User' }
  });
}

export async function POST(request: NextRequest) {
  console.log('⚠️  [auth] POST request - Auth disabled');
  // Возвращаем мок-ответ для регистрации/входа
  return NextResponse.json({ 
    user: { 
      id: 'demo-user-' + Date.now(), 
      email: 'demo@example.com', 
      name: 'Demo User',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    session: {
      id: 'demo-session-' + Date.now(),
      userId: 'demo-user',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
}
