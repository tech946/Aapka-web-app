'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const PUBLIC_PATHS = ['/influencer/login', '/influencer/register'];

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isInfluencer, setIsInfluencer] = useState<boolean | null>(null);
  const supabase = createClientComponentClient();

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (isPublic) {
      setChecking(false);
      return;
    }

    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (active) {
          setChecking(false);
          setIsInfluencer(false);
          router.replace('/influencer/login');
        }
        return;
      }

      const res = await fetch(`/api/influencer-portal/me`);
      const json = await res.json();
      if (!active) return;

      if (res.ok && json.data) {
        setIsInfluencer(true);
      } else {
        await supabase.auth.signOut();
        setIsInfluencer(false);
        router.replace('/influencer/login');
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname, isPublic, supabase, router]);

  if (isPublic) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="container max-w-lg mx-auto py-8 px-4">
          {children}
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isInfluencer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link href="/influencer/dashboard" className="font-semibold">
            Aapka Tourism — Influencer Portal
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/influencer/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/influencer/packages" className="hover:underline">
              Packages
            </Link>
            <Link href="/influencer/earnings" className="hover:underline">
              Earnings
            </Link>
            <Link href="/influencer/wallet" className="hover:underline">
              Wallet
            </Link>
            <Link href="/influencer/profile" className="hover:underline">
              Profile
            </Link>
            <Link
              href="/api/influencer-portal/logout"
              className="text-muted-foreground hover:text-foreground"
            >
              Logout
            </Link>
          </nav>
        </div>
      </header>
      <main className="container max-w-4xl mx-auto py-8 px-4">{children}</main>
    </div>
  );
}
