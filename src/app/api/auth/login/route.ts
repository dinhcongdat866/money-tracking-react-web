import { NextRequest, NextResponse } from 'next/server';
import { AuthTokenPayload, signAuthToken } from '@/lib/auth-token';
import { getAuthCookieName } from '@/lib/auth';

const MOCK_USER = {
  id: '1',
  email: 'demo@example.com',
  password: 'password123',
  name: 'Demo User',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isValid =
      normalizedEmail === MOCK_USER.email && password === MOCK_USER.password;

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Sign JWT token
    const payload: AuthTokenPayload = {
      sub: MOCK_USER.id,
      email: MOCK_USER.email,
    };

    const token = await signAuthToken(payload);

    // Set cookie
    const cookieName = getAuthCookieName();
    const response = NextResponse.json({
      user: {
        id: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name,
      },
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login.' },
      { status: 500 }
    );
  }
}

