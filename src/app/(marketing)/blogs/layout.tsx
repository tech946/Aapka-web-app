import type { ReactNode } from 'react';
import ExHeader from '../Home/ex/ExHeader';
import { ExFooter } from '../Home/ex/ExSections';
import { EX_FONTS } from '../Home/ex/fonts';
import '../Home/ex/ex.css';

export default function BlogsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      {children}
      <ExFooter />
    </div>
  );
}
