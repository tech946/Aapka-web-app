import { Award, Headset, HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import { REVIEWS } from '@/components/site/reviews';

/* "Why choose Aapka Tourism?" — pickyourtrail.com's band: centred display
   title, a row of icon + big brand-orange figure + label, then one real review.
   Only figures the site already publishes; add a rating or award here only
   once there's a real source for it. */
const ITEMS = [
  { icon: Users, value: '10,000+', label: 'Happy travellers' },
  { icon: Award, value: '12+ yrs', label: 'Dubai & UAE travel' },
  { icon: HeartHandshake, value: '98%', label: 'Retention rate' },
  { icon: Headset, value: '24X7', label: 'Trip support' },
  { icon: ShieldCheck, value: '100%', label: 'Secure payments' },
];

export default function TrustStrip() {
  const review = REVIEWS[0];
  return (
    <div className="why_choose rn__section__gapTop mk-band">
      <div className="container">
        <h2 className="mk-display why_choose__title">Why choose Aapka Tourism?</h2>
        <ul className="why_choose__list">
          {ITEMS.map(({ icon: Icon, value, label }) => (
            <li key={label}>
              <span className="why_choose__icon" aria-hidden="true">
                <Icon size={26} strokeWidth={1.9} />
              </span>
              <span className="why_choose__text">
                <b>{value}</b>
                <small>{label}</small>
              </span>
            </li>
          ))}
        </ul>
        {review ? (
          <figure className="why_choose__review">
            <blockquote>“{review.text.length > 150 ? review.text.slice(0, 147).trimEnd() + '…' : review.text}”</blockquote>
            <figcaption>{review.name}</figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
