import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { cookies } from 'next/headers';

// Обработчик всех auth запросов
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('🔵 Auth GET request:', pathname);
  
  try {
    // Проверка сессии
    if (pathname.includes('/session')) {
      const cookieStore = await cookies();
      const token = cookieStore.get('session')?.value;
      
      if (!token) {
        return NextResponse.json({ user: null, session: null });
      }
      
      const session = await auth.getSession(token);
      return NextResponse.json(session || { user: null, session: null });
    }
    
    return NextResponse.json({ message: 'OK' });
  } catch (error) {
    console.error('❌ Auth GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('🔵 Auth POST request:', pathname);
  
  try {
    const body = await request.json();
    
    // Регистрация
    if (pathname.includes('/sign-up')) {
      const { email, password, name } = body;
      
      if (!email || !password || !name) {
        return NextResponse.json(
          { error: 'Email, password, and name are required' },
          { status: 400 }
        );
      }
      
      const result = await auth.signUp(email, password, name);
      
      // Установка сессии в cookie
      const response = NextResponse.json({ 
        user: result.user,
        session: result.session 
      });
      response.cookies.set('session', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
      });
      
      return response;
    }
    
    // Вход
    if (pathname.includes('/sign-in')) {
      const { email, password } = body;
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }
      
      const result = await auth.signIn(email, password);
      
      // Установка сессии в cookie
      const response = NextResponse.json({ 
        user: result.user,
        session: result.session 
      });
      response.cookies.set('session', result.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
      });
      
      return response;
    }
    
    // Выход
    if (pathname.includes('/sign-out')) {
      const response = NextResponse.json({ success: true });
      response.cookies.delete('session');
      return response;
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    console.error('❌ Auth POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.message ? 400 : 500 }
    );
  }
}
