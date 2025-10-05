'use client';

import { useState } from 'react';
import { Sidebar, Header, Main } from '@/components/dashboard';
import './dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className='main-content'>
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
  );
}
