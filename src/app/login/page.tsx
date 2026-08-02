import { auth } from "@/auth";
import Link from "next/link";
import { ArrowRight, Calendar, LayoutGrid } from "lucide-react";

/**
 * Only allow internal, same-origin redirect targets to avoid open-redirect
 * vulnerabilities. Anything that isn't a plain "/path" falls back to /schedules.
 */
function safeCallbackUrl(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/schedules";
}

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}>) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  const session = await auth();
  if (session?.user) {
    // Already authenticated. Do NOT server-redirect here: visiting /login
    // while logged in (e.g. via the browser Back button after sign-in) would
    // otherwise bounce forward on every navigation, hammering the server.
    // Render a simple "continue" panel instead and let the user click through.
    return (
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-500/15 to-fuchsia-500/10 blur-3xl animate-float" />
        </div>

        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-card/70 p-8 text-center shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              You&apos;re already signed in
            </h1>
            <p className="text-sm text-muted-foreground">
              Continue to your schedules to pick up where you left off.
            </p>
          </div>
          <Link
            href={redirectTo}
            className="press-down group flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background shadow-lg shadow-foreground/10 transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl hover:shadow-foreground/20 active:translate-y-0 active:scale-[0.98]"
          >
            <LayoutGrid className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            Continue to dashboard
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/"
            className="block text-xs font-medium text-primary hover:underline"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      {/* Decorative background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-500/15 to-fuchsia-500/10 blur-3xl animate-float" />
      </div>

      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card/70 p-8 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-4 duration-500 sm:p-10">
        {/* Brand */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="group flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 animate-gradient hover:animate-jelly">
            <Calendar className="h-8 w-8 text-white transition-transform duration-500 group-hover:rotate-[360deg]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your team&apos;s schedule.
            </p>
          </div>
        </div>

        {/* Keycloak */}
        <a
          href={`/api/auth/keycloak/login?callbackUrl=${encodeURIComponent(redirectTo)}`}
          className="press-down group flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background shadow-lg shadow-foreground/10 transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl hover:shadow-foreground/20 active:translate-y-0 active:scale-[0.98]"
        >
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          Sign in
        </a>

        <p className="text-center text-xs text-muted-foreground">
          You&apos;ll be redirected to our secure sign-in — use your account, or
          continue with Google there. New here? You can register too.{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
