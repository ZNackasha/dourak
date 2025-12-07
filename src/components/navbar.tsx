import Link from "next/link";
import { auth, signOut } from "@/auth";
import { MobileNavbar } from "./mobile-navbar";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
                Dourak
              </Link>
            </div>
            {session?.user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/schedules">Schedules</NavLink>
              </div>
            )}
          </div>
          <div className="flex items-center">
            {session?.user ? (
              <>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {session.user.image ? (
                      <img
                        className="h-8 w-8 rounded-full ring-2 ring-white"
                        src={session.user.image}
                        alt=""
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {session.user.name?.[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium text-zinc-700 hidden md:block">
                      {session.user.name}
                    </span>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button className="text-sm text-zinc-500 hover:text-indigo-600 font-medium transition-colors">
                      Sign out
                    </button>
                  </form>
                </div>
                <MobileNavbar user={session.user} />
              </>
            ) : (
              <Link
                href="/"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-zinc-500 hover:text-indigo-600 hover:border-indigo-500 transition-colors"
    >
      {children}
    </Link>
  );
}
