import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY:
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
    NEXT_PUBLIC_GEMINI_API_KEYS:
      process.env.NEXT_PUBLIC_GEMINI_API_KEYS || process.env.GEMINI_API_KEYS || "",
    NEXT_PUBLIC_ELEVENLABS_API_KEY:
      process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || "",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8000",
  },
  cacheComponents: true,
  partialPrefetching: true,
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
