/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for local mobile builds, disable for Vercel
  output: process.env.VERCEL ? undefined : 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
