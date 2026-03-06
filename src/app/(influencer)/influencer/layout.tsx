'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LayoutDashboard, Package, Wallet, TrendingUp, User, LogOut } from 'lucide-react';
import './influencer.css';

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
      try {
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
          setChecking(false);
          setIsInfluencer(true);
        } else {
          setChecking(false);
          await supabase.auth.signOut();
          setIsInfluencer(false);
          router.replace('/influencer/login');
        }
      } catch {
        if (active) {
          setChecking(false);
          setIsInfluencer(false);
          router.replace('/influencer/login');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname, isPublic, supabase, router]);

  if (isPublic) {
    return (
      <div className="influencer-portal min-h-screen bg-gradient-to-b from-muted/40 to-muted/20">
        <div className="container max-w-lg mx-auto py-12 px-4">
          {children}
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="influencer-portal min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin w-10 h-10 border-2 border-[#ff4c00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isInfluencer) {
    return null;
  }

  const navItems = [
    { href: '/influencer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/influencer/packages', label: 'Packages', icon: Package },
    { href: '/influencer/earnings', label: 'Earnings', icon: TrendingUp },
    { href: '/influencer/wallet', label: 'Wallet', icon: Wallet },
    { href: '/influencer/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="influencer-portal min-h-screen bg-gradient-to-b from-muted/40 to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/influencer/dashboard" className="font-semibold text-lg flex items-center gap-2">
            <span className="text-[#ff4c00]">Aapka Tourism</span>
            <span className="text-muted-foreground font-normal text-sm">— Influencer Portal</span>
          </Link>
          <nav className="flex items-center gap-1 flex-wrap justify-end">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || (href !== '/influencer/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
            <Link
              href="/api/influencer-portal/logout"
              className="nav-link flex items-center gap-2 text-muted-foreground ml-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Link>
          </nav>
        </div>
      </header>
      <main className="container max-w-4xl mx-auto py-10 px-4">{children}</main>
    </div>
  );
}
