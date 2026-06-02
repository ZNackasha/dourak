import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "sonner";
import { auth } from "@/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const themeInitScript = `(() => { try { const t = localStorage.getItem('dourak-theme') || 'system'; const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.classList.toggle('dark', isDark); document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'; } catch (_) {} })();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dourak",
  description:
    "Coordinate users with Google Calendar integration",
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
                  <SidebarTrigger className="-ml-1" />
                  <div className="ml-auto">
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 animate-in fade-in duration-300">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          ) : (
            <div className="relative flex-1 flex flex-col">
              <div className="absolute right-4 top-4 z-10">
                <ThemeToggle />
              </div>
              <main className="flex-1 animate-in fade-in duration-300">{children}</main>
            </div>
          )}
          <Toaster position="top-center" richColors theme="system" />
        </ThemeProvider>
      </body>
    </html>
  );
}
