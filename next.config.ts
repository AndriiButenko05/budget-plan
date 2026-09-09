import type { NextConfig } from "next";

/**
 * Заголовки безпеки. Сайт приватний і нічого не вбудовує,
 * тому обмеження можна ставити максимально жорсткі.
 */
const securityHeaders = [
  // Заборона показувати сайт у <iframe> — захист від клікджекінгу.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  // Браузер не вгадує тип файлу, а бере той, що вказав сервер.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Назовні не витікають адреси сторінок із параметрами.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Камера, мікрофон, геолокація сайту не потрібні.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
