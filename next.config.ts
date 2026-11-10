import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  devIndicators: false,
  // The design is fully server-rendered and reads the database on every
  // request. Cache Components would require wrapping every uncached read in
  // Suspense for little benefit here, so it stays disabled.
  cacheComponents: false,
  // Accessing the dev server through 127.0.0.1 instead of localhost otherwise
  // breaks the HMR/cross-origin handshake and React never hydrates.
  allowedDevOrigins:
    process.env.NODE_ENV === "development"
      ? ["127.0.0.1", "127.0.0.1:3000", "localhost", "localhost:3000"]
      : undefined,
  // ali-oss pulls in urllib, which lazily requires the optional `proxy-agent`
  // package. Keep it external so Turbopack does not try to bundle that path.
  serverExternalPackages: ["knex", "mysql2", "ali-oss"],
  images: {
    loader: "custom",
    loaderFile: "./lib/image-loader.ts",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
