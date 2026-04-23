import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [{ source: '/bankroll', destination: '/banca', permanent: true }];
  },
};

export default nextConfig;
