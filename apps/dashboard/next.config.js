/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@glamsite/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

module.exports = nextConfig;
