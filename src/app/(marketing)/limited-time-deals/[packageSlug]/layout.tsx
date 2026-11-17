import type { ReactNode } from 'react';
import HeroPreload from '@/components/site/pdp/HeroPreload';

type Params = Promise<{ packageSlug: string }>;

export default function DealLayout({ children, params }: { children: ReactNode; params: Params }) {
  return (
    <>
      <HeroPreload source='packages' slug={params.then((p) => p.packageSlug)} />
      {children}
    </>
  );
}
