import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { getAccessUser, type AccessUser } from '@/lib/access/server';
import { hasAnyPermission, type Permission } from '@/lib/access/permissions';
import { ApiError, badRequest, forbidden, unauthorized } from './errors';

export interface HandlerContext<P> {
  user: AccessUser;
  params: P;
}

type Handler<P> = (req: NextRequest, ctx: HandlerContext<P>) => Promise<unknown>;

type RouteSegment<P> = { params: Promise<P> };

export function withPermission<P = Record<string, never>>(required: Permission | Permission[], handler: Handler<P>) {
  const needed = Array.isArray(required) ? required : [required];

  return async (req: NextRequest, segment: RouteSegment<P>): Promise<Response> => {
    try {
      const user = await getAccessUser();
      if (!user) throw unauthorized();
      if (!hasAnyPermission(user.permissions, needed)) throw forbidden();

      const params = (segment?.params ? await segment.params : {}) as P;
      const result = await handler(req, { user, params });
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export async function readBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const raw = await req.json().catch(() => {
    throw badRequest('Request body must be JSON.');
  });
  return schema.parse(raw);
}

export function readQuery<S extends ZodTypeAny>(req: NextRequest, schema: S): z.output<S> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}

function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join('.');
    const message = issue ? (field ? `${field}: ${issue.message}` : issue.message) : 'Invalid input.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
  console.error('[api]', error);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}
