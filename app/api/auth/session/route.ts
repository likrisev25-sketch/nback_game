import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const session = await auth.getSession(token);
    
    if (!session) {
      return NextResponse.json(
        { session: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Auth session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ session: null });
  }

  try {
    const session = await auth.getSession(token);
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Auth session error:', error);
    return NextResponse.json({ session: null });
  }
}
