'use client';

import { usePathname } from 'next/navigation';
import { Sidebar, Header, Main } from '@/components/dashboard';
import { DashboardSession } from '@/components/dashboard/DashboardSession';
import './dashboard.css';
import '@/app/(influencer)/influencer/influencer.css';
import './crm-shell.css';
import './crm-pages.css';
import './dashboard-kit.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInfluencerSection = pathname?.startsWith('/dashboard/influencers');

  return (
    <DashboardSession>
      <div className='dashboard_root'>
        <Sidebar />
        <div className={`main-content ${isInfluencerSection ? 'influencer-section' : ''}`}>
          <Header />
          <Main>{children}</Main>
        </div>
      </div>
    </DashboardSession>
  );
}
