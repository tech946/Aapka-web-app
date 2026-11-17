import ExHeader from '@/app/(marketing)/Home/ex/ExHeader';
import { EX_FONTS } from '@/app/(marketing)/Home/ex/fonts';
import '@/app/(marketing)/Home/ex/ex.css';

export default function NavyHeader() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS} style={{ display: 'contents' }}>
      <ExHeader />
    </div>
  );
}
