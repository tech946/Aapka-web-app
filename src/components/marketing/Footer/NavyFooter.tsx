import { ExFooter } from '@/app/(marketing)/Home/ex/ExSections';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import '@/app/(marketing)/Home/ex/ex.css';

export default function NavyFooter() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS} style={{ display: 'contents' }}>
      <ExFooter />
    </div>
  );
}
