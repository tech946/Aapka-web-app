import FrHeader from './FrHeader';
import FrHero from './FrHero';
import FrReveal from './FrReveal';
import FrReviews from './FrReviews';
import FrScrollImages from './FrScrollImages';
import { FrAbout, FrDestinations, FrExperiences, FrFaq, FrFooter, FrStories } from './FrSections';
import { FR_FONTS } from './fonts';
import './foreigner.css';

export default function FrHome() {
  return (
    <div className={'fr ' + FR_FONTS}>
      <FrHeader />
      <main>
        <FrHero />
        <FrAbout />
        <FrDestinations />
        <FrFaq />
        <FrReviews />
        <FrExperiences />
        <FrStories />
        <FrScrollImages />
      </main>
      <FrFooter />
      <FrReveal />
    </div>
  );
}
