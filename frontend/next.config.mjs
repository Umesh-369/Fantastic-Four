const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/gateway/:path*",
        destination: `${apiBase}/v1/:path*`,
      },
      {
        source: "/api/rules/:path*",
        destination: `${apiBase}/v1/rules/:path*`,
      },
      {
        source: "/api/fairness/:path*",
        destination: `${apiBase}/v1/fairness/:path*`,
      },
      {
        source: "/api/audit/:path*",
        destination: `${apiBase}/v1/audit/:path*`,
      }
    ];
  },
};

export default nextConfig;
