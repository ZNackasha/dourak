import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Calendar } from "lucide-react";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpMenu } from "@/components/onboarding/help-menu";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";
import { getCanonicalUrl } from "@/lib/site";

const themeInitScript = `(() => { try { const t = localStorage.getItem('dourak-theme') || 'system'; const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', isDark); document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'; } catch (_) {} })();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getCanonicalUrl();
const siteDescription =
  "Dourak is smart team scheduling that syncs with your Google Calendar and auto-fills every shift—balancing roles, availability, and fairness. Stop wrangling spreadsheets and schedule your volunteers in seconds.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dourak — Smart Team Scheduling with Google Calendar",
    template: "%s · Dourak",
  },
  description: siteDescription,
  applicationName: "Dourak",
  keywords: [
    "team scheduling",
    "volunteer scheduling",
    "shift scheduling software",
    "Google Calendar scheduling",
    "automatic schedule generator",
    "volunteer coordination",
    "rota planner",
    "staff scheduling app",
    "church volunteer scheduling",
    "free scheduling tool",
  ],
  authors: [{ name: "Dourak" }],
  creator: "Dourak",
  publisher: "Dourak",
  alternates: {
    canonical: "/",
  },
  category: "productivity",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Dourak",
    title: "Dourak — Schedule your team in seconds, not weekends",
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dourak — Smart Team Scheduling with Google Calendar",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAuthed = !!session?.user;

  return (
    <html lang="en" className="h-full bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {isAuthed ? (
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur px-4">
                  {/* Desktop collapse lives in the sidebar itself; this opens the mobile sheet. */}
                  <SidebarTrigger className="-ml-1 press-down hover:animate-jelly md:hidden" />
                  {/* Branding lives in the sidebar on desktop; show it here only on mobile. */}
                  <Link
                    href="/"
                    className="group flex items-center gap-2 text-lg font-bold text-primary tracking-tight hover:opacity-90 transition-opacity press-down md:hidden"
                  >
                    <Calendar className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                    <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 group-hover:after:w-full">
                      Dourak
                    </span>
                  </Link>
                  <div className="ml-auto flex items-center gap-1">
                    <HelpMenu />
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 animate-in fade-in duration-300">
                  {children}
                </main>
                <WelcomeTour />
              </SidebarInset>
            </SidebarProvider>
          ) : (
            <div className="relative flex-1 flex flex-col">
              <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur px-4">
                <Link
                  href="/"
                  className="group flex items-center gap-2 text-lg font-bold text-primary tracking-tight hover:opacity-90 transition-opacity press-down"
                >
                  <Calendar className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                  <span className="relative after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 group-hover:after:w-full">
                    Dourak
                  </span>
                </Link>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 animate-in fade-in duration-300">
                {children}
              </main>
            </div>
          )}
          <Toaster position="top-center" richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
