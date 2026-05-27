import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Обработка различных путей API
  if (path.includes('/api/auth/sign-up')) {
    // Логика регистрации
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  }
  
  if (path.includes('/api/auth/sign-in')) {
    // Логика входа
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  }
  
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  try {
    const body = await request.json();
    
    if (path.includes('/api/auth/sign-up')) {
      const { email, password, name } = body;
      const result = await auth.signUp(email, password, name);
      return NextResponse.json(result);
    }
    
    if (path.includes('/api/auth/sign-in')) {
      const { email, password } = body;
      const result = await auth.signIn(email, password);
      return NextResponse.json(result);
    }
    
    if (path.includes('/api/auth/sign-out')) {
      const { sessionId } = body;
      await auth.signOut(sessionId);
      return NextResponse.json({ success: true });
    }
    
    if (path.includes('/api/auth/session')) {
      const { token } = body;
      const session = await auth.getSession(token);
      return NextResponse.json({ session });
    }
    
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
