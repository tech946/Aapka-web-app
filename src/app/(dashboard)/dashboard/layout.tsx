'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, Header, Main } from '@/components/dashboard';
import { ContentEditorGuard } from '@/components/dashboard/ContentEditorGuard';
import { DashboardLoader } from '@/components/dashboard/DashboardLoader';
import { useUserRoles } from '@/hooks/use-roles';
import './dashboard.css';
import '@/app/(influencer)/influencer/influencer.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isInfluencerSection = pathname?.startsWith('/dashboard/influencers');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading } = useUserRoles();
  const hadLoadingRef = useRef(false);

  useEffect(() => {
    if (loading) hadLoadingRef.current = true;
  }, [loading]);

  // Redirect to login only when fetch completed with no user (e.g. 401/session expired)
  useEffect(() => {
    if (!hadLoadingRef.current || loading || user !== null) return;
    router.replace('/auth/login');
  }, [loading, user, router]);

  // Show loader until user roles are loaded - prevents sidebar glitch when switching accounts
  const rolesReady = !loading && user !== null;
  if (!rolesReady) {
    return <DashboardLoader />;
  }

  return (
    <ContentEditorGuard>
      <div className='dashboard_root'>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className={`main-content ${isInfluencerSection ? 'influencer-section' : ''}`}>
          {/* Header */}
          <Header />

          {/* Main content */}
          <Main>{children}</Main>
        </div>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </ContentEditorGuard>
  );
}
