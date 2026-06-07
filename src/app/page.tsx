import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCanonicalUrl } from "@/lib/site";
import {
  Calendar,
  CalendarSync,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  LayoutGrid,
  MailPlus,
} from "lucide-react";

const features = [
  {
    icon: CalendarSync,
    title: "Google Calendar Sync",
    desc: "Import events straight from your Google Calendar in seconds. No copy-paste, no spreadsheets.",
    color: "from-indigo-500 to-violet-600",
  },
  {
    icon: Sparkles,
    title: "Smart Auto-Scheduling",
    desc: "Our engine fills every shift for you—balancing roles, availability, and fairness automatically.",
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    icon: ShieldCheck,
    title: "Conflict Detection",
    desc: "Double-bookings? Never again. Overlaps are caught before they become a problem.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Users,
    title: "Role Management",
    desc: "Define roles, set who's required or optional, and let the right people land in the right spots.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: MailPlus,
    title: "One-Click Team Invites",
    desc: "Bring your whole team on board with shareable invite links and email sign-in.",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: LayoutGrid,
    title: "Matrix View",
    desc: "See every person and every shift at a glance with a clean, color-coded schedule grid.",
    color: "from-rose-500 to-red-600",
  },
];

const steps = [
  {
    icon: CalendarSync,
    title: "Connect your calendar",
    desc: "Sign in with Google and link the calendar that holds your events.",
  },
  {
    icon: Users,
    title: "Add your team & roles",
    desc: "Invite volunteers, define roles, and set availability in minutes.",
  },
  {
    icon: Zap,
    title: "Generate the schedule",
    desc: "Hit one button and watch every shift fill itself—fairly and instantly.",
  },
];

const stats = [
  { value: "1-Click", label: "Schedule generation" },
  { value: "Zero", label: "Double-bookings" },
  { value: "100%", label: "Google Calendar synced" },
  { value: "Minutes", label: "Not hours of planning" },
];

const faqs = [
  {
    q: "What is Dourak?",
    a: "Dourak is a smart team scheduling app that syncs with your Google Calendar and automatically fills every shift\u2014balancing roles, availability, and fairness\u2014so you can schedule volunteers and staff in seconds instead of hours.",
  },
  {
    q: "How does Dourak work with Google Calendar?",
    a: "Sign in with Google, link the calendar that holds your events, and Dourak imports them instantly. There's no copy-pasting or spreadsheets\u2014your events stay in sync automatically.",
  },
  {
    q: "Is Dourak free to use?",
    a: "Yes. You can get started for free with your Google account\u2014no credit card required\u2014and set up your first schedule in under five minutes.",
  },
  {
    q: "Can I invite my whole team?",
    a: "Absolutely. Share a single invite link or sign teammates in by email, then assign roles and let the auto-scheduler do the rest.",
  },
  {
    q: "How does automatic scheduling avoid double-booking?",
    a: "Dourak's scheduling engine detects overlapping shifts and balances assignments across your team, so no one is ever booked in two places at once.",
  },
];

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/schedules");
  }

  const siteUrl = getCanonicalUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Dourak",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        description:
          "Smart team scheduling that syncs with your Google Calendar and auto-fills every shift—balancing roles, availability, and fairness.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="relative overflow-hidden bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Decorative background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-fuchsia-500/10 blur-3xl animate-float" />
        <div className="absolute top-1/3 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-sky-500/20 to-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-pink-500/10 blur-3xl" />
      </div>

      {/* ===================== HERO ===================== */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-20 text-center sm:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Sparkles className="h-4 w-4 text-primary" />
          Scheduling your team just got effortless
        </div>

        <div className="group mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 animate-float animate-gradient hover:animate-jelly">
          <Calendar className="h-10 w-10 text-white transition-transform duration-500 group-hover:rotate-[360deg]" />
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-100 fill-mode-both">
          Schedule your team in{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            seconds
          </span>
          {", not weekends."}
        </h1>

        <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-3 duration-700 delay-200 fill-mode-both">
          Dourak syncs with your Google Calendar and auto-fills every shift—
          balancing roles, availability, and fairness so you can stop wrangling
          spreadsheets and start leading your team.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300 fill-mode-both">
          <Link
            href="/login"
            className="press-down group flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background shadow-lg shadow-foreground/10 transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl hover:shadow-foreground/20 active:translate-y-0 active:scale-[0.98]"
          >
            <svg
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Get started free with Google
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="text-xs text-muted-foreground">
            No credit card required · Set up in under 5 minutes
          </p>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border bg-card/50 p-6 shadow-sm backdrop-blur sm:grid-cols-4 sm:p-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to run a flawless schedule
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for volunteer coordinators, team leads, and anyone tired of
            herding cats by hand.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            From zero to scheduled in 3 steps
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            So simple it almost feels like cheating
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="mx-auto mb-3 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================== BENEFITS ===================== */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-card/40 p-8 shadow-sm sm:p-12">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Why teams switch to Dourak
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Cut scheduling time from hours to minutes",
              "Never double-book a volunteer again",
              "Keep everyone in sync with Google Calendar",
              "Fair, balanced shifts—automatically",
              "Manage roles and availability in one place",
              "Invite your whole team with a single link",
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span className="text-sm text-foreground/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FINAL CTA ===================== */}
      <section className="mx-auto max-w-2xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-lg sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/20 blur-3xl"
          />
          <h2 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to reclaim your weekends?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-muted-foreground">
            Join your team on Dourak and let smart scheduling do the heavy
            lifting.
          </p>

          <div className="relative mx-auto mt-8 max-w-sm space-y-4">
            <Link
              href="/login"
              className="press-down group flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-6 py-3.5 text-base font-semibold text-background shadow-lg shadow-foreground/10 transition-all hover:-translate-y-0.5 hover:opacity-95 hover:shadow-xl hover:shadow-foreground/20 active:translate-y-0 active:scale-[0.98]"
            >
              <svg
                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <p className="text-xs text-muted-foreground">
              Sign in with Google or email · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know before you get started.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors open:bg-card hover:border-primary/40"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold marker:content-['']">
                {item.q}
                <span className="text-primary transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Dourak
          </div>
          <p>Smart team scheduling, powered by Google Calendar.</p>
          <p>© {new Date().getFullYear()} Dourak</p>
        </div>
      </footer>
    </div>
  );
}
