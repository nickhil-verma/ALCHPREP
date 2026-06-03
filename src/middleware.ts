import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all API routes except auth endpoints
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const authHeader = req.headers.get('authorization');
    const tokenCookie = req.cookies.get('access_token');

    const hasAuthHeader = authHeader && authHeader.startsWith('Bearer ');
    const hasTokenCookie = !!tokenCookie?.value;

    if (!hasAuthHeader && !hasTokenCookie) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication token is missing',
          },
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

// Config to specify matching paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
