/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/locales/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/csv',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
