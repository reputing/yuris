import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "x-content-type-options", value: "nosniff" },
        { key: "referrer-policy", value: "no-referrer" },
        { key: "x-frame-options", value: "DENY" },
        // The adult-content label that parental-control and filtering software looks for (rtalabel.org).
        { key: "rating", value: "RTA-5042-1996-1400-1577-RTA" },
      ],
    }];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
