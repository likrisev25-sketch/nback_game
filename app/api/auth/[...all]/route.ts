import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { cookies } from 'next/headers';

// Обработчик всех auth запросов
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('🔵 Auth GET request:', pathname);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    // Проверка сессии
    if (pathname.includes('/session')) {
      const cookieStore = await cookies();
      const token = cookieStore.get('session')?.value;
      
      if (!token) {
        return NextResponse.json({ user: null, session: null }, { headers: corsHeaders });
      }
      
      const session = await auth.getSession(token);
      return NextResponse.json(session || { user: null, session: null }, { headers: corsHeaders });
    }
    
    return NextResponse.json({ message: 'OK' }, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ Auth GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('🔵 Auth POST request:', pathname);
  
  // Добавляем CORS headers для Vercel
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    const body = await request.json();
    
    // Регистрация
    if (pathname.includes('/sign-up')) {
      const { email, password, name } = body;
      
      if (!email || !password || !name) {
        return NextResponse.json(
          { error: 'Email, password, and name are required' },
          { status: 400, headers: corsHeaders }
        );
      }
      
      const result = await auth.signUp(email, password, name);
      
      // Установка сессии в cookie
      const response = NextResponse.json({ 
        user: result.user,
        session: result.session 
      }, { headers: corsHeaders });
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
          { status: 400, headers: corsHeaders }
        );
      }
      
      const result = await auth.signIn(email, password);
      
      // Установка сессии в cookie
      const response = NextResponse.json({ 
        user: result.user,
        session: result.session 
      }, { headers: corsHeaders });
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
      const response = NextResponse.json({ success: true }, { headers: corsHeaders });
      response.cookies.delete('session');
      return response;
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
  } catch (error: any) {
    console.error('❌ Auth POST error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: error.message ? 400 : 500, headers: corsHeaders }
      );
  }
}

// Обработчик OPTIONS для CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
