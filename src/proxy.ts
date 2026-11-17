// proxy.ts (Next.js 16 name for middleware.ts)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    const headers = new Headers(req.headers);
    headers.set('x-pathname', req.nextUrl.pathname);
    return NextResponse.next({ request: { headers } });
  }

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        // Refreshed tokens go on the request (for the page being rendered) and the response (for the browser)
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() checks the token with Supabase Auth and refreshes it if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect all /dashboard routes
  if (!user && req.nextUrl.pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    const redirect = NextResponse.redirect(loginUrl);
    res.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|txt|xml|json|webmanifest|woff2?|ttf|css|js|map|pdf)$).*)',
  ],
};
