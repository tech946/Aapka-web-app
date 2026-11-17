import type { ReactNode } from 'react';
import PolicyShell from '@/components/site/policy/PolicyShell';

export default function Layout({ children }: { children: ReactNode }) {
  return <PolicyShell>{children}</PolicyShell>;
}
