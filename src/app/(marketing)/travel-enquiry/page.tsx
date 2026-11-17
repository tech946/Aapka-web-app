import { applyPageSeo } from '@/features/seo/server';
import type { Metadata } from 'next';
import { HydrationBoundary } from '@tanstack/react-query';
import { prefetchEnquiry } from './prefetch';
import ExHeader from '../Home/ex/ExHeader';
import { ExFooter } from '../Home/ex/ExSections';
import { EX_FONTS } from '../Home/ex/fonts';
import EnquiryForm from './EnquiryForm';
import '../Home/ex/ex.css';
import './enquiry.css';
import './enquiry-ex.css';

const PAGE_METADATA: Metadata = {
  title: 'Plan Your Trip | Aapka Tourism',
  description:
    'Tell us about your Dubai trip — dates, travellers, hotel and tours — and our travel experts will send you a tailored plan and price.',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

export default async function TravelEnquiryPage() {
  const state = await prefetchEnquiry();
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <HydrationBoundary state={state}>
        <EnquiryForm />
      </HydrationBoundary>
      <ExFooter />
    </div>
  );
}
