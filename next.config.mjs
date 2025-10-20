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
    serverComponentsExternalPackages: [],
  },
  // Configure body parser for API routes
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase from default 1mb to 50mb
    },
  },
};

export default nextConfig;
