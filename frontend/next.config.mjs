/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/gateway/:path*",
        destination: "http://127.0.0.1:8000/v1/:path*",
      },
      {
        source: "/api/rules/:path*",
        destination: "http://127.0.0.1:8003/v1/rules/:path*",
      },
      {
        source: "/api/fairness/:path*",
        destination: "http://127.0.0.1:8006/v1/fairness/:path*",
      },
      {
        source: "/api/audit/:path*",
        destination: "http://127.0.0.1:8005/v1/audit/:path*",
      }
    ];
  },
};

export default nextConfig;
