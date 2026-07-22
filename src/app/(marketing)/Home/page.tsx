import BannerSection from './BannerSection';
import EleganceSection from './EleganceSection';
// import OfferPackagesSection from './OfferPackagesSection';
import MarinaCruiseSection from './MarinaCruiseSection';
import ToursSection from './ToursSection';
import BlogsSection from './BlogsSection';
import TestimonialsSection from './TestimonialsSection';
import TourActivitiesSection from './TourActivitiesSection';
import FAQSection from './FAQSection';
import SocialGrid from './SocialGrid';

export default function Home() {
  return (
    <div>
      <BannerSection />
      {/* <OfferPackagesSection /> */}
      <MarinaCruiseSection />
      <ToursSection />
      <EleganceSection />
      <BlogsSection />
      {/* <PromotionalSection /> */}
      {/* <DealsOfTheDaySection /> */}
      <TestimonialsSection />
      <TourActivitiesSection />
      <FAQSection />
      {/* <SocialGrid /> */}
    </div>
  );
}
