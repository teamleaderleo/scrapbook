/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: `${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}`,
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Better image compression
  },

  // Remove console.log in production (keeps error/warn)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // React Compiler is stable in Next.js 16!
  reactCompiler: true,

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-markdown',
      '@/components',
      '@/components/ui',
      '@/components/space',
    ],
  },
};

export default nextConfig;