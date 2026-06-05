import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permitir abrir el dev server desde celulares en la misma WiFi.
  allowedDevOrigins: ["192.168.4.29"],
};

export default nextConfig;
