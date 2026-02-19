import { NextResponse } from 'next/server';
import { getAuthCookieName } from '@/lib/auth';

export async function POST() {
  try {
    const cookieName = getAuthCookieName();
    const response = NextResponse.json({ success: true });

    response.cookies.delete(cookieName);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout.' },
      { status: 500 }
    );
  }
}

