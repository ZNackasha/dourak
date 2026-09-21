/**
 * Only allow internal, same-origin redirect targets to avoid open redirects.
 * Anything that isn't a plain "/path" falls back to /schedules.
 */
export function safeCallbackUrl(
  raw: string | string[] | null | undefined,
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/schedules";
}
