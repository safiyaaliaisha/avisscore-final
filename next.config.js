/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['media.leroymerlin.fr', 'images.unsplash.com', 'lloswaqfitxhfmunebzx.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.leroymerlin.fr',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
