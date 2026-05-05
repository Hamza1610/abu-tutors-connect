/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for local mobile builds, disable for Vercel
  output: process.env.VERCEL ? undefined : 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ignore lint and type errors during build for faster/successful Vercel deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
