// next.config.mjs
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // podés agregar acá cualquier otra opción que necesites
};

export default withPWA({
  dest: "public", // genera sw.js y workbox en /public
  register: true, // registra el Service Worker automáticamente
  skipWaiting: true, // toma control apenas se instala
  disable: !isProd, // en dev NO usa SW, solo en build prod
})(nextConfig);
