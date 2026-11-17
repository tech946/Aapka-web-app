import Link from 'next/link';
import { Clock } from 'lucide-react';
import { durationLabel, priceLabel, startingPrice, type HomePackage } from '../home-data';

/* Homepage package card (pickyourtrail.com's itinerary card): photo, name,
   duration line, a soft brand type tag, then the "from" price per person beside a
   brand View Details button. */
export default function PackageCard({ pkg, href, isAgent, tag }: { pkg: HomePackage; href: string; isAgent: boolean; tag?: string }) {
  const duration = durationLabel(pkg);
  const priced = startingPrice(pkg) != null;
  const nights = pkg.package_nights ?? (pkg.package_days && pkg.package_days > 1 ? pkg.package_days - 1 : 0);

  return (
    <Link href={href} className="pkg_card">
      <span className="pkg_card__media">
        <img src={pkg.thumbnail_image || '/images/package-1.png'} alt="" loading="lazy" />
      </span>

      <span className="pkg_card__body">
        <span className="pkg_card__name" title={pkg.package_name}>
          {pkg.package_name}
        </span>
        {duration ? (
          <span className="pkg_card__meta">
            <Clock size={14} strokeWidth={2} aria-hidden="true" />
            {duration}
          </span>
        ) : null}
        {tag ? <span className="pkg_card__tag">{tag}</span> : null}
      </span>

      <span className="pkg_card__foot">
        <span className="pkg_card__price">
          <b className={priced ? '' : 'is-soon'}>{priceLabel(pkg, isAgent)}</b>
          {priced ? <small>{nights > 0 ? `${nights} nights / person` : 'per person'}</small> : null}
        </span>
        <span className="pkg_card__cta">View Details</span>
      </span>
    </Link>
  );
}
