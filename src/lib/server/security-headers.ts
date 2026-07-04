export type SecurityHeader = {
  key: string;
  value: string;
};

/** CSP tuned for Next.js App Router + Supabase + reCAPTCHA v3 (+ optional Stripe frames). */
export function buildContentSecurityPolicy(isProduction: boolean): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https: http:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://www.google.com https://js.stripe.com",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function buildSecurityHeaders(isProduction = process.env.NODE_ENV === "production"): SecurityHeader[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(isProduction),
    },
  ];
}
