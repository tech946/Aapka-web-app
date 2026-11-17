import ExHeader from './ExHeader';
import ExHero from './ExHero';
import { DealsBand, PopularBand } from './ExRows';
import { ExFooter, WhereNext, WhyUs } from './ExSections';
import ExFaq from './ExFaq';
import ExMotion from './ExMotion';
import { NightBanner, PromoBanner, VisaBanner } from './ExPromo';
import ExStories from './ExStories';
import ExTestimonials from './ExTestimonials';
import { EX_FONTS } from './fonts';
import './ex.css';

export default function ExHome() {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main>
        <ExHero />
        <DealsBand />
        <PopularBand />
        <PromoBanner />
        <WhereNext />
        <WhyUs />
        <NightBanner />
        <ExStories />
        <ExTestimonials />
        <VisaBanner />
        <ExFaq />
      </main>
      <ExFooter />
      <ExMotion />
    </div>
  );
}
