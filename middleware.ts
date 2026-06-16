import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/api');
  if (isPublic) return NextResponse.next();

  const token = request.cookies.get('sb-access-token')?.value;
  const isAuthPage = pathname.startsWith('/auth');
  const isAppPage = pathname.startsWith('/app') || ['/dashboard', '/goals', '/coach', '/progress', '/resources', '/profile', '/upgrade', '/recommendations'].some(p => pathname === p || pathname.startsWith(p + '/'));
  const isOnboardingPage = pathname.startsWith('/onboarding');

  if (!token) {
    if (isAppPage || isOnboardingPage) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*', '/onboarding/:path*', '/dashboard/:path*', '/goals/:path*', '/coach/:path*', '/progress/:path*', '/resources/:path*', '/profile/:path*'],
};
