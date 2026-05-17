import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  console.log('🔵 [REGISTER] POST request received');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    const body = await request.json();
    const { email, password, name } = body;
    
    console.log('🔵 [REGISTER] Registration attempt:', email);
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    const result = await auth.signUp(email, password, name);
    
    console.log('✅ [REGISTER] Registration successful');
    
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
    console.error('❌ [REGISTER] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
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
