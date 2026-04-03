import clsx from 'clsx';
import { PACKAGE_PRICE_REVEALING_SOON } from '@/lib/package-pricing';
import './package-price-revealing-soon.css';

export type PackagePriceRevealingSoonVariant =
  | 'card'
  | 'hero'
  | 'pill'
  | 'dropdown';

export function PackagePriceRevealingSoonLabel({
  variant = 'card',
  className,
}: {
  variant?: PackagePriceRevealingSoonVariant;
  className?: string;
}) {
  return (
    <span
      role='status'
      aria-live='polite'
      className={clsx(
        'package-price-revealing-soon',
        variant === 'card' && 'package-price-revealing-soon--card',
        variant === 'hero' && 'package-price-revealing-soon--hero',
        variant === 'pill' && 'package-price-revealing-soon--pill',
        variant === 'dropdown' && 'package-price-revealing-soon--dropdown',
        className
      )}
    >
      {PACKAGE_PRICE_REVEALING_SOON}
    </span>
  );
}
