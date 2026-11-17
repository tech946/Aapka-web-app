import TaSearch from '@/components/site/ta/TaSearch';
import type { HeroSection } from '@/content/home';

/* Top of the homepage: the brand video full screen (100svh), the site header
   floating over it see-through (Header's .is-clear), and the big centred
   question with the search pill under it in the middle. The poster shows
   until the video has frames, and instead of it for reduced motion. */

const HERO_VIDEO = '/videos/home-hero.mp4'; // 3840×2160, 30fps

export function TaHero({ content }: { content: HeroSection }) {
  return (
    <section className="ta-hero" aria-label="Search holidays">
      <img className="ta-hero__poster" src={content.poster} width="1920" height="1080" alt="" fetchPriority="high" />
      <video className="ta-hero__video" autoPlay muted loop playsInline preload="auto" poster={content.poster} aria-hidden="true">
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <h1 className="ta-hero__title">{content.title}</h1>
      <div className="ta-hero__search">
        <TaSearch />
      </div>
    </section>
  );
}
