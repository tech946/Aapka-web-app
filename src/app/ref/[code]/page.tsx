import { redirect } from 'next/navigation';

/**
 * Referral link landing: /ref/[code]
 * Redirects to the API route that sets the cookie and redirects.
 * Cookies can only be modified in Route Handlers in Next.js App Router.
 */
export default async function RefRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) redirect('/');

  redirect(`/api/referral/apply?code=${encodeURIComponent(code)}`);
}
