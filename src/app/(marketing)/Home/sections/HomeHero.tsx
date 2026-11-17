'use client';

import Link from 'next/link';

/* Homepage hero (pickyourtrail.com's, on every screen size): a black band
   with the background video — 60vh on desktop, 50vh on phones. Desktop's
   floating header comes from Header (.is-overlay); phones get the logo on
   the video. The headline + search sit on HeroPanel's top edge, just below. */

const HERO = {
  video: '/videos/home-hero.mp4', // 3840×2160, 30fps
  poster: '/images/package-3.jpg', // Palm Jumeirah aerial: shown until the video has frames
};

export default function HomeHero() {
  return (
    <section className="dhero" aria-label="Aapka Tourism">
      <img className="dhero__poster" src={HERO.poster} width="1920" height="1080" alt="" fetchPriority="high" />
      <video className="dhero__video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src={HERO.video} type="video/mp4" />
      </video>

      <div className="dhero__bar">
        <Link href="/" className="dhero__logo" aria-label="Aapka Tourism home">
          <img src="/aapka-tourism-logo-dark.png" width="404" height="322" alt="Aapka Tourism" />
        </Link>
      </div>
    </section>
  );
}
