import type { NextConfig } from "next";

// console.log("THIS_ENV_IS:", process.env.THIS_ENV_IS);

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Suppress Supabase realtime-js warnings
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@supabase\/realtime-js/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

export default nextConfig;
