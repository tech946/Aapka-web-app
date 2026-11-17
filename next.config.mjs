/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: '25mb',
  },
  // (Next.js 16 no longer lints during `next build`, so the old
  // eslint.ignoreDuringBuilds option is gone.)
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'swmowsmjzznmueewmxqa.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    localPatterns: [{ pathname: '/__none__' }],
    minimumCacheTTL: 2678400,
  },
  // Moved from experimental in Next.js 15
  serverExternalPackages: [],
  // All listings live on /holidays now (src/config/holiday-types.ts). The old
  // listing URLs are still linked from emails, referral links and bookmarks,
  // so they land on the matching filter. Detail pages are untouched: each
  // source below matches one segment only, so /category/<slug>/<package>,
  // /marina-cruise-dinner/<id> and /limited-time-deals/<slug> don't match.
  // Temporary (307) until the new page has settled; flip to permanent later.
  async redirects() {
    return [
      { source: '/category/:slug', destination: '/holidays?type=:slug', permanent: false },
      { source: '/marina-cruise-dinner', destination: '/holidays?type=marina-cruise', permanent: false },
      { source: '/limited-time-deals', destination: '/holidays?type=limited-time-deals', permanent: false },
      // There is no cart any more: one package is booked at a time, straight
      // from its page. Old /cart links open that booking's checkout (which
      // sends people to /holidays when nothing is being booked).
      { source: '/cart', destination: '/checkout', permanent: false },
    ];
  },
  // Browser caching for the homepage media. Files named after their Instagram
  // reel id never change in place (a new reel = a new file), so they're
  // cached for a year; other videos (e.g. the hero, which may be swapped
  // under the same name) for a week. Later rules win for the same header.
  async headers() {
    return [
      {
        source: '/videos/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        source: '/videos/stories/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/insta-stories/:file*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
