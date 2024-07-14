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
    domains: ['setzen.s3.us-east-2.amazonaws.com', 'd17l3nej64kqkk.cloudfront.net'],
  },
};

export default nextConfig;