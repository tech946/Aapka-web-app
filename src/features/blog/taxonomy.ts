import { notFound } from '@/lib/api/errors';
import { TAXONOMY_META, type TaxonomyKind } from './constants';

export function parseTaxonomyKind(value: string): TaxonomyKind {
  if (Object.hasOwn(TAXONOMY_META, value)) return value as TaxonomyKind;
  throw notFound();
}
