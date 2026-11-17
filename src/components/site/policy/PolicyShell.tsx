import type { ReactNode } from 'react';
import ExHeader from '@/app/(marketing)/Home/ex/ExHeader';
import { ExFooter } from '@/app/(marketing)/Home/ex/ExSections';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import '@/app/(marketing)/Home/ex/ex.css';
import './policy-ex.css';

export default function PolicyShell({ children }: { children: ReactNode }) {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <div className="pl">
        <div className="pl-band" aria-hidden="true" />
        {children}
      </div>
      <ExFooter />
    </div>
  );
}
