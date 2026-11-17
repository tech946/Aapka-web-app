import { Star } from 'lucide-react';
import { REVIEWS } from './reviews';
import './styles/trust-badge.css';

/* "Trusted by" line: an avatar stack of real reviewers' initials, five
   stars and the claim. Reusable above any page heading. */

const AVATARS = REVIEWS.slice(0, 4).map((r) =>
  r.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
);

export default function TrustBadge({ text = 'Trusted by 10,000+ travellers' }: { text?: string }) {
  return (
    <div className="trust-badge">
      <span className="trust-badge__faces" aria-hidden="true">
        {AVATARS.map((initials, i) => (
          <span key={i} className="trust-badge__face">
            {initials}
          </span>
        ))}
      </span>
      <span className="trust-badge__text">
        <span className="trust-badge__stars" role="img" aria-label="Rated 5 out of 5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} aria-hidden="true" />
          ))}
        </span>
        {text}
      </span>
    </div>
  );
}
