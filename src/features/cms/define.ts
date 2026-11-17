import type { CmsField, CmsObject } from './fields';

export type CmsPreview = { kind: 'path'; path: string };

export interface CmsPageDefinition<T extends CmsObject = CmsObject> {
  key: string;
  title: string;
  description: string;
  group: string;
  preview: CmsPreview;
  revalidate: { path: string; type?: 'page' | 'layout' }[];
  fields: CmsField[];
  defaults: T;
}

export function defineCmsPage<T extends CmsObject>(definition: CmsPageDefinition<T>): CmsPageDefinition<T> {
  return definition;
}

export const cmsCacheTag = (key: string) => `cms:${key}`;
