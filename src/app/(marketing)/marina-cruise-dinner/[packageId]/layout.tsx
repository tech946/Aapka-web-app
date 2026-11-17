import type { ReactNode } from 'react';
import HeroPreload from '@/components/site/pdp/HeroPreload';

type Params = Promise<{ packageId: string }>;

export default function MarinaLayout({ children, params }: { children: ReactNode; params: Params }) {
  return (
    <>
      <HeroPreload source='marina-cruise-dinners' slug={params.then((p) => p.packageId)} />
      {children}
    </>
  );
}
