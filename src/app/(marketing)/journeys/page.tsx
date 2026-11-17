import type { Metadata } from 'next';
import { applyPageSeo } from '@/features/seo/server';
import NavyHeader from '@/components/marketing/Header/NavyHeader';
import FrReveal from '../Home/foreigner/FrReveal';
import FrScrollImages from '../Home/foreigner/FrScrollImages';
import NavyFooter from '@/components/marketing/Footer/NavyFooter';
import { FR_FONTS } from '../Home/foreigner/fonts';
import JourneysGrid from './foreigner/JourneysGrid';
import { JOURNEYS_BANNER } from './foreigner/content';
import '../Home/foreigner/foreigner.css';
import './foreigner/journeys.css';

const PAGE_METADATA: Metadata = {
  title: 'Journeys | Aapka Tourism',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

export default function JourneysPage() {
  return (
    <div className={'fr ' + FR_FONTS}>
      <NavyHeader />
      <main>
        <section className="fr-section jr-banner">
          <div className="fr-container">
            <div className="jr-banner__text">
              <h1 className="jr-banner__title" data-reveal>
                {JOURNEYS_BANNER.title}
              </h1>
              <div className="fr-para-width">
                <p data-reveal>{JOURNEYS_BANNER.text}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="fr-section jr-list">
          <div className="fr-container">
            <JourneysGrid />
          </div>
        </section>
        <FrScrollImages />
      </main>
      <NavyFooter />
      <FrReveal />
    </div>
  );
}
