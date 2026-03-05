import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle POST to /checkout (e.g. from payment gateway redirects).
 * Redirect to same URL with GET so the page can render.
 * Fixes 405 Method Not Allowed when CCAvenue or other gateways POST to checkout.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const target = url.pathname + (url.search || '');
  return NextResponse.redirect(url.origin + target, { status: 302 });
}
