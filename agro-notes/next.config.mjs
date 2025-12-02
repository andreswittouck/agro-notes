// next.config.mjs

const isProd = process.env.NODE_ENV === "production";

import withPWA from "next-pwa";

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV !== "production",
  buildExcludes: [/app-build-manifest\.json$/], // 👈 esto
})({
  reactStrictMode: true,
});
