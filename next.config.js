/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Ignore TypeScript errors during build - see MAINT-001 ticket for fixes
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  env: {
    // API base URL - adjust for environment
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  },
  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = nextConfig;
