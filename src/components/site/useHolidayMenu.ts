'use client';

import { useMemo } from 'react';
import { useCategoriesWithPackages } from '@/hooks/use-marketing-queries';
import { ALL_TYPES, HOLIDAY_TYPES, holidaysHref, typeForCategory, type HolidayType } from '@/config/holiday-types';
import { categorySlug } from './site-config';

/* The Holidays menu = the chips on /holidays: every category with live
   packages plus Marina, labelled and ordered by src/config/holiday-types.ts.
   Shared by the desktop header and the mobile "More" sheet. */

interface Category {
  id?: string;
  category_id?: string;
  categoryId?: string;
  name: string;
  description?: string | null;
}

export interface HolidayMenuItem {
  key: string;
  href: string;
  label: string;
  /** one-line hint under the label; may be empty */
  hint: string;
}

/* Hint = the type's configured tagline, else the start of its CRM description. */
function hintFor(type: HolidayType, description?: string | null): string {
  if (type.tagline) return type.tagline;
  const desc = (description || '').trim();
  return desc.length > 42 ? desc.slice(0, 40).trimEnd() + '…' : desc;
}

export const ALL_HOLIDAYS: HolidayMenuItem = {
  key: 'all',
  href: '/holidays',
  label: ALL_TYPES.label,
  hint: ALL_TYPES.tagline,
};

/** Holiday types with live packages (without the "All Holidays" entry). */
export function useHolidayMenu(): HolidayMenuItem[] {
  const { data = [] } = useCategoriesWithPackages(100);
  const categories = data as unknown as Category[];

  return useMemo(
    () =>
      [
        ...categories.map((cat) => typeForCategory(categorySlug(cat.name), cat.name)),
        ...HOLIDAY_TYPES.filter((t) => t.source.kind === 'marina'),
      ]
        .sort((a, b) => a.order - b.order)
        .map((type) => {
          const cat = categories.find((c) => categorySlug(c.name) === type.key);
          return { key: type.key, href: holidaysHref(type.key), label: type.label, hint: hintFor(type, cat?.description) };
        }),
    [categories],
  );
}
