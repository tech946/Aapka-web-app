/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configure API routes to handle larger request bodies
  experimental: {
    // Increase the maximum request body size for API routes
    serverComponentsExternalPackages: [
      '@supabase/supabase-js',
      '@supabase/auth-helpers-nextjs',
      '@supabase/auth-helpers-shared',
    ],
  },
  // Externalize Supabase packages to avoid bundling issues
  serverExternalPackages: [
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    '@supabase/auth-helpers-shared',
  ],
  // Configure body parser for API routes
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase from default 1mb to 50mb
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Externalize Supabase packages on server side to avoid ESM bundling issues
    if (isServer) {
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals)
          ? originalExternals
          : [originalExternals]),
        {
          '@supabase/supabase-js': '@supabase/supabase-js',
          '@supabase/auth-helpers-nextjs': '@supabase/auth-helpers-nextjs',
          '@supabase/auth-helpers-shared': '@supabase/auth-helpers-shared',
        },
      ];
    }

    return config;
  },
};

export default nextConfig;
