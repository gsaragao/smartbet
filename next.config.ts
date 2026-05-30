import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

// Há um `package-lock.json` em `../workspace` (pasta pai). O Turbopack do Next 16
// pode inferir essa pasta como raiz e falhar ao resolver `tailwindcss` (sem
// node_modules lá). Fix: raiz explícita = diretório deste app.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [{ source: '/bankroll', destination: '/banca', permanent: true }];
  },
};

export default nextConfig;
