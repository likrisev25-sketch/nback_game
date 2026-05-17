import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔵 [LOGOUT] POST request received');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  try {
    const response = NextResponse.json({ success: true }, { headers: corsHeaders });
    response.cookies.delete('session');
    console.log('✅ [LOGOUT] Session cleared');
    return response;
  } catch (error: any) {
    console.error('❌ [LOGOUT] Error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
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
