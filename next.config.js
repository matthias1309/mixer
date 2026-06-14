// Sub-path the app is served under (e.g. "/rezepte" on Uberspace).
// Empty in local dev so the app stays at the root. Must start with "/" and have
// no trailing slash when set.
const basePath = process.env.BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only set basePath/assetPrefix when configured — passing an empty string
  // is not allowed by Next.js.
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  typescript: {
    // Ignore TypeScript errors during build - see MAINT-001 ticket for fixes
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // Do not fail the production build on lint errors - see MAINT-001 ticket.
    // Linting is still run separately via `npm run lint`.
    ignoreDuringBuilds: true,
  },
  env: {
    // API base URL - adjust for environment
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    // Exposes the base path to client code (consumed by src/lib/api-url.ts).
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
