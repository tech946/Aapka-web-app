'use client';

import { usePathname } from 'next/navigation';
import ChatbotWidget from './ChatbotWidget';

export default function ConditionalChatbot() {
  const pathname = usePathname();

  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAuthRoute = pathname?.startsWith('/auth');
  const isAgentDashboard = pathname?.startsWith('/agent/dashboard');

  if (isDashboardRoute || isAuthRoute || isAgentDashboard) {
    return null;
  }

  return <ChatbotWidget />;
}
