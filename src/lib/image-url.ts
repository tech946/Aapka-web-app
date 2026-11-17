const OPTIMIZED_HOST = 'swmowsmjzznmueewmxqa.supabase.co';
const OPTIMIZED_PATH = '/storage/v1/object/public/';
const WIDTHS = [384, 640, 828, 1080, 1200, 1920];

function canOptimize(src: string): boolean {
  if (!src.startsWith('https://')) return false;
  try {
    const url = new URL(src);
    return url.hostname === OPTIMIZED_HOST && url.pathname.startsWith(OPTIMIZED_PATH);
  } catch {
    return false;
  }
}

function resized(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}

const LOCAL_VARIANTS: Record<string, [string, number][]> = {
  '/images/package-3.jpg': [
    ['/images/package-3-960.jpg', 960],
    ['/images/package-3.jpg', 1920],
  ],
  '/images/about-section-1.jpg': [
    ['/images/about-section-1-720.jpg', 720],
    ['/images/about-section-1.jpg', 1440],
  ],
  '/images/about-section-2.jpg': [
    ['/images/about-section-2-720.jpg', 720],
    ['/images/about-section-2.jpg', 1440],
  ],
  '/images/about-section-3.jpg': [
    ['/images/about-section-3-720.jpg', 720],
    ['/images/about-section-3.jpg', 1440],
  ],
};

export type ResponsiveImage = { src: string; srcSet?: string; sizes?: string };

export function responsiveImage(src: string, sizes: string, maxWidth = 1200): ResponsiveImage {
  const local = LOCAL_VARIANTS[src];
  if (local) return { src, srcSet: local.map(([url, w]) => `${url} ${w}w`).join(', '), sizes };
  if (!canOptimize(src)) return { src };
  const widths = WIDTHS.filter((w) => w <= maxWidth);
  return {
    src: resized(src, widths[widths.length - 1]),
    srcSet: widths.map((w) => `${resized(src, w)} ${w}w`).join(', '),
    sizes,
  };
}
