/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@memopics/shared"],
  /** Allow phone/LAN access in dev (fixes blank page when not using localhost). */
  allowedDevOrigins: [
    "172.20.10.6",
    "192.168.10.22",
    "192.168.0.103",
    "192.168.0.106",
    "192.168.0.105",
    "192.168.137.1",
    "localhost",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.0.105",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "192.168.0.103",
        port: "9000",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
