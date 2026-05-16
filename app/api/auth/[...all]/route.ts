import { auth } from '@/server/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest, NextResponse } from 'next/server';

const handler = toNextJsHandler(auth);

// Добавляем логи для отладки
export async function GET(request: NextRequest) {
  console.log('🔵 Auth GET request:', request.nextUrl.pathname);
  try {
    const response = await handler.GET(request);
    console.log('✅ Auth GET response:', response.status);
    return response;
  } catch (error) {
    console.error('❌ Auth GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('🔵 Auth POST request:', request.nextUrl.pathname);
  try {
    const response = await handler.POST(request);
    console.log('✅ Auth POST response:', response.status);
    return response;
  } catch (error) {
    console.error('❌ Auth POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
