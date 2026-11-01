import type { NextConfig } from "next";

// Only the FCEN site may embed the app (https://fcen.unal.edu.co/menu/facultad/practicas/).
const frameAncestors = [
  "'self'",
  "https://fcen.unal.edu.co",
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:*", "http://127.0.0.1:*"]),
].join(" ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors}` },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
