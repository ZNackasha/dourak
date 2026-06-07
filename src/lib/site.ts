/**
 * Resolves the canonical site URL.
 *
 * The app is served under multiple domains (dourak.app, dourak.z-soft.dev,
 * and Vercel deployment URLs). For SEO we must advertise a single canonical
 * origin so search engines don't penalize duplicate content. Set
 * NEXT_PUBLIC_SITE_URL to your preferred primary domain in production.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL            — explicit canonical domain (recommended)
 *   2. NEXTAUTH_URL                    — auth origin, usually the live domain
 *   3. VERCEL_PROJECT_PRODUCTION_URL   — stable Vercel production domain
 *   4. VERCEL_URL                      — per-deployment Vercel URL (previews)
 *   5. https://dourak.app              — final fallback
 */
const PRIMARY_DOMAIN = "https://dourak.app";

function withProtocol(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
}

export function getSiteUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    PRIMARY_DOMAIN;

  return withProtocol(candidate).replace(/\/$/, "");
}

/**
 * The canonical origin to advertise to crawlers, regardless of which domain
 * actually served the request. Always points at the primary domain unless an
 * explicit NEXT_PUBLIC_SITE_URL override is provided.
 */
export function getCanonicalUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  return withProtocol(explicit || PRIMARY_DOMAIN).replace(/\/$/, "");
}
