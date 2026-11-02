/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@glamsite/shared"],
  // Pages used to live under /dashboard (dashboard.glamsitestudio.com/dashboard/…).
  // Keep old links and bookmarks working.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/", permanent: true },
      { source: "/dashboard/:path*", destination: "/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
    ],
  },
};

module.exports = nextConfig;
