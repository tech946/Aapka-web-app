import BannerSection from './BannerSection';
import EleganceSection from './EleganceSection';
import SuitesSection from './SuitesSection';
import TestimonialsSection from './TestimonialsSection';
import SocialGrid from './SocialGrid';

export default function Home() {
  return (
    <div>
      <BannerSection />
      <SuitesSection />
      <EleganceSection />
      {/* <PromotionalSection /> */}
      {/* <DealsOfTheDaySection /> */}
      <TestimonialsSection />
      <SocialGrid />
    </div>
  );
}
