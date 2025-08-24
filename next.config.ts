import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: false, // 禁用 PPR 以避免预渲染问题
    clientSegmentCache: true
  }
};

export default nextConfig;
