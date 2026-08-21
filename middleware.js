import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;

  // Login and auth endpoints must always be reachable. Authentication is
  // completed and verified inside the route/page handlers themselves.
  if (path === '/admin/login' || path.startsWith('/auth/')) {
    return NextResponse.next();
  }

  if (path.startsWith('/admin')) {
    // Keep the routing layer deliberately lightweight and network-free.
    // This is only an early convenience redirect; every admin page also
    // verifies the Supabase user and admin_users authorization server-side.
    const hasSupabaseSessionCookie = request.cookies
      .getAll()
      .some(({ name }) => name.startsWith('sb-') && name.includes('-auth-token'));

    if (!hasSupabaseSessionCookie) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
};
