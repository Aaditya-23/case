/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["utfs.io"],
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/admin-dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
