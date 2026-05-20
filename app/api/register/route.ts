import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('🔵 [REGISTER] POST request received');
  
  try {
    const body = await request.json();
    const { email, password, name } = body;
    
    console.log('🔵 [REGISTER] Registration attempt:', email);
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    const result = await auth.signUp(email, password, name);
    
    console.log('✅ [REGISTER] Registration successful');
    console.log('🔵 [REGISTER] Setting session cookie for user:', result.user.name);
    
    const response = NextResponse.json({ 
      user: result.user,
      session: result.session 
    });
    
    response.cookies.set('session', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    console.log('🔵 [REGISTER] Cookie set successfully');
    return response;
  } catch (error: any) {
    console.error('❌ [REGISTER] Error:', error);
    console.error('❌ [REGISTER] Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
