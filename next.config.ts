import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://nback-game-topaz.vercel.app',
    BETTER_AUTH_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://nback-game-topaz.vercel.app',
  },
};

export default nextConfig;
