import { applyPageSeo } from '@/features/seo/server';
import type { Metadata } from 'next';
import ExHeader from '../Home/ex/ExHeader';
import { EX_FONTS } from '../Home/ex/fonts';
import PlanFlow from './PlanFlow';
import '../Home/ex/ex.css';
import './plan.css';

const PAGE_METADATA: Metadata = {
  title: 'Plan My Trip | Aapka Tourism',
  description: 'Design your own Dubai holiday in a few quick steps. A travel expert sends you a tailored plan and price on WhatsApp within 24 hours.',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

export default function PlanMyTripPage() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main>
        <PlanFlow />
      </main>
    </div>
  );
}
