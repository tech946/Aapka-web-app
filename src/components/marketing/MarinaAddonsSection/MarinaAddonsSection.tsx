'use client';

import type { MarinaAddon } from '@/lib/marina-cruise-config';

type Props = {
  addons: MarinaAddon[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  adults: number;
  children: number;
};

function formatAddonPriceHint(
  addon: MarinaAddon,
  adults: number,
  children: number
): string {
  const parts: string[] = [];
  const adultP = Number(addon.adult_price) || 0;
  const childP = Number(addon.child_price) || 0;
  if (adultP > 0 && adults > 0) {
    parts.push(`Adult AED ${adultP}`);
  }
  if (childP > 0 && children > 0) {
    parts.push(`Child AED ${childP}`);
  }
  if (parts.length === 0) {
    if (adultP > 0) return `AED ${adultP} / adult`;
    if (childP > 0) return `AED ${childP} / child`;
    return 'Included';
  }
  return parts.join(' · ');
}

export function MarinaAddonsSection({
  addons,
  selectedIds,
  onToggle,
  adults,
  children,
}: Props) {
  if (!addons.length) return null;

  return (
    <div className='booking-addons-section marina-booking-addons'>
      <h4 className='booking-addons-title'>Add-ons</h4>
      <div className='marina-booking-addons-list'>
        {addons.map(addon => {
          const checked = selectedIds.includes(addon.id);
          return (
            <label
              key={addon.id}
              className={`marina-booking-addon-row${checked ? ' marina-booking-addon-row-selected' : ''}`}
            >
              <input
                type='checkbox'
                checked={checked}
                onChange={() => onToggle(addon.id)}
              />
              <span className='marina-booking-addon-name'>{addon.name}</span>
              <span className='marina-booking-addon-price'>
                {formatAddonPriceHint(addon, adults, children)}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
