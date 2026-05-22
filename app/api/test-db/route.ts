import { NextResponse } from 'next/server';
import { db } from '@/db/db';

export async function GET() {
  console.log('🔵 [test-db] Test endpoint called');
  
  if (!db) {
    console.error('❌ [test-db] Database is null');
    return NextResponse.json({ error: 'Database not available' }, { status: 500 });
  }
  
  try {
    console.log('🔵 [test-db] Testing database connection...');
    const users = await db.query.users.findMany();
    console.log('✅ [test-db] Found users:', users.length);
    
    return NextResponse.json({
      success: true,
      dbConnected: true,
      usersCount: users.length,
    });
  } catch (error: unknown) {
    console.error('❌ [test-db] Error:', error);
    return NextResponse.json({
      error: (error as Error).message,
      stack: (error as Error).stack,
    }, { status: 500 });
  }
}
