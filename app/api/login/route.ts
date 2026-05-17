import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('🔵 [LOGIN] POST request received');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log('🔵 [LOGIN] Login attempt:', email);
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const result = await auth.signIn(email, password);
    
    console.log('✅ [LOGIN] Login successful');
    
    const response = NextResponse.json({ 
      user: result.user,
      session: result.session 
    }, { headers: corsHeaders });
    
    response.cookies.set('session', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ [LOGIN] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 500, headers: corsHeaders }
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
