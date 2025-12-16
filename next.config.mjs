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
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Externalize Supabase to avoid bundling issues
  serverExternalPackages: ['@supabase/supabase-js'],
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
    // Handle ESM modules for Supabase
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };
    return config;
  },
};

export default nextConfig;
