import 'server-only';
import { Suspense } from 'react';
import { NextRequest } from 'next/server';
import { GET as getPackage } from '@/app/api/packages/[id]/route';
import { GET as getMarina } from '@/app/api/marina-cruise-dinners/[id]/route';
import { getPackageGalleryImages } from '@/lib/package-gallery';
import { responsiveImage } from '@/lib/image-url';
import { GALLERY_MAIN_MAX, GALLERY_MAIN_SIZES } from './gallery-sizes';

type Source = 'packages' | 'marina-cruise-dinners';

const HANDLERS = { packages: getPackage, 'marina-cruise-dinners': getMarina };

async function FirstImage({ source, slug }: { source: Source; slug: Promise<string> }) {
  try {
    const id = await slug;
    const res = await HANDLERS[source](new NextRequest(new URL(`/api/${source}/${id}`, 'http://localhost')), {
      params: { id },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { gallery?: unknown; thumbnail_image?: string | null } };
    const first = json.data ? getPackageGalleryImages(json.data.gallery, json.data.thumbnail_image)[0] : undefined;
    if (!first) return null;
    const image = responsiveImage(first, GALLERY_MAIN_SIZES, GALLERY_MAIN_MAX);
    return (
      <link
        rel='preload'
        as='image'
        href={image.src}
        imageSrcSet={image.srcSet}
        imageSizes={image.sizes}
        fetchPriority='high'
      />
    );
  } catch {}
  return null;
}

export default function HeroPreload({ source, slug }: { source: Source; slug: Promise<string> }) {
  return (
    <Suspense fallback={null}>
      <FirstImage source={source} slug={slug} />
    </Suspense>
  );
}
