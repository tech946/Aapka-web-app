import 'server-only';
import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { serializeJsonLd, type JsonValue } from '@/features/blog/structured-data/build';
import { buildPageJsonLd, buildSiteJsonLd } from './build';
import { normalizePath } from './keys';
import type { Placement } from './schema';
import { getSeoForPath } from './service';

const currentPath = cache(async (): Promise<string | null> => {
  try {
    const value = (await headers()).get('x-pathname');
    return value ? normalizePath(value) : null;
  } catch {
    return null;
  }
});

const seoForRequest = cache(async (path: string) => getSeoForPath(path));

function isPublic(path: string): boolean {
  return !path.startsWith('/dashboard') && !path.startsWith('/auth') && !path.startsWith('/api');
}

export async function applyPageSeo(base: Metadata, explicitPath?: string): Promise<Metadata> {
  const path = explicitPath ?? (await currentPath());
  if (!path) return base;
  const seo = await seoForRequest(path);
  if (!seo || (!seo.metaTitle && !seo.metaDescription)) return base;

  const openGraph = { ...(base.openGraph ?? {}) };
  const twitter = { ...(base.twitter ?? {}) };
  if (seo.metaTitle) {
    openGraph.title = seo.metaTitle;
    twitter.title = seo.metaTitle;
  }
  if (seo.metaDescription) {
    openGraph.description = seo.metaDescription;
    twitter.description = seo.metaDescription;
  }

  return {
    ...base,
    ...(seo.metaTitle ? { title: { absolute: seo.metaTitle } } : {}),
    ...(seo.metaDescription ? { description: seo.metaDescription } : {}),
    openGraph,
    twitter,
  };
}

function JsonLdScript({ data, id }: { data: JsonValue; id?: string }) {
  return <script type='application/ld+json' id={id} dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}

export async function PageJsonLd({ placement }: { placement: Placement }) {
  const path = await currentPath();
  if (!path || !isPublic(path)) return null;

  const seo = await seoForRequest(path);
  const items = (seo?.schemas ?? []).filter((s) => s.enabled && s.placement === placement);
  const docs = items.length ? buildPageJsonLd(items.map((s) => s.block), path) : [];

  return (
    <>
      {placement === 'head' && <JsonLdScript id='site-schema' data={buildSiteJsonLd()} />}
      {docs.map((doc, i) => (
        <JsonLdScript key={i} data={doc} />
      ))}
    </>
  );
}
