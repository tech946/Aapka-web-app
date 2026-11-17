import type { ReactNode } from 'react';
import HeroPreload from '@/components/site/pdp/HeroPreload';

type Params = Promise<{ slug: string; packageId: string }>;

export default function PackageLayout({ children, params }: { children: ReactNode; params: Params }) {
  return (
    <>
      <HeroPreload source='packages' slug={params.then((p) => p.packageId)} />
      {children}
    </>
  );
}
