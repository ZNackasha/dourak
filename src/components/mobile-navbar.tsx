"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function MobileNavbar({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null;

  return (
    <div className="sm:hidden ml-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-500 hover:text-zinc-900 p-2 rounded-md hover:bg-zinc-100"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-zinc-200 shadow-lg py-2 px-4 flex flex-col gap-2 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 mb-2">
            {user.image ? (
              <img
                className="h-8 w-8 rounded-full ring-2 ring-zinc-100"
                src={user.image}
                alt=""
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                {user.name?.[0]}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900">{user.name}</span>
              <span className="text-xs text-zinc-500">{user.email}</span>
            </div>
          </div>

          <Link
            href="/schedules"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/schedules")
                ? "bg-indigo-50 text-indigo-700"
                : "text-zinc-700 hover:bg-zinc-50"
              }`}
          >
            Schedules
          </Link>

          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
