import Link from 'next/link';
import { holidaysHref } from '@/config/holiday-types';

type ImageBannerProps = {
  href: string;
  src: string;
  alt: string;
  label: string;
};

function ImageBanner({ href, src, alt, label }: ImageBannerProps) {
  return (
    <section className="ex-bnr-band" aria-label={label}>
      <Link href={href} className="ex-bnr">
        <img
          className="ex-bnr__img"
          src={src}
          srcSet={`${src.replace('.webp', '-1000.webp')} 1000w, ${src} 2000w`}
          sizes="100vw"
          alt={alt}
          width={2000}
          height={667}
          loading="lazy"
          decoding="async"
        />
      </Link>
    </section>
  );
}

export function PromoBanner() {
  return (
    <ImageBanner
      href={holidaysHref('offer-packages')}
      src="/images/banners/dubai-offers.webp"
      alt="Explore Dubai & Abu Dhabi holidays with family and friends, planned by locals. Book now."
      label="Dubai and Abu Dhabi offer packages"
    />
  );
}

export function NightBanner() {
  return (
    <ImageBanner
      href={holidaysHref('flexible-date-packages')}
      src="/images/banners/anydate.webp"
      alt="Any Date Dubai Holidays: your trip, your dates, planned by locals. Explore Anydate packages."
      label="Anydate packages"
    />
  );
}

export function VisaBanner() {
  return (
    <ImageBanner
      href="/visas/apply-for-oman-visa"
      src="/images/banners/oman-visa.webp"
      alt="Oman Tourist Visa, applied by our team in Dubai. Simple documents, quick processing, WhatsApp support."
      label="Oman tourist visa"
    />
  );
}
