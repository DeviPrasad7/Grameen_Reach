/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http',  hostname: 'minio' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
  i18n: {
    locales: ['en', 'te'],
    defaultLocale: 'en',
  },
};

module.exports = nextConfig;
