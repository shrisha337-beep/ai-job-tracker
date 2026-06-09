import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page and API auth routes without token
        const { pathname } = req.nextUrl;
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/'
        ) {
          return true;
        }
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
