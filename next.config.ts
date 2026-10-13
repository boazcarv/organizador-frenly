import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  /**
   * The app is served through a preview proxy (https://{port}-{id}.e2b.app)
   * while `next dev` would normally reject any request whose Origin/Host is
   * not localhost — which surfaced as 403s on JS/CSS/font chunks inside the
   * preview and left a half-rendered page. Allowing the proxy hosts keeps the
   * dev preview byte-for-byte identical to the local one.
   */
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1", "0.0.0.0"],

  /** Hide the floating dev badge: it does not belong in product reviews. */
  devIndicators: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
