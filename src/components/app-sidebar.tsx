import * as React from "react"
import { Calendar, LogOut } from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { SidebarNav } from "@/components/sidebar-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth } from "@/auth"
import { db } from "@/lib/prisma"

export async function AppSidebar() {
  const session = await auth()

  // Same visibility rule as /schedules: owned or co-administered.
  const schedules = session?.user?.id
    ? await db.schedule.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { admins: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
    })
    : []

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex-row items-center justify-between border-b border-sidebar-border px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link href="/" className="group flex items-center gap-2 text-xl font-bold text-primary tracking-tight hover:opacity-90 transition-opacity press-down group-data-[collapsible=icon]:hidden">
          <Calendar className="w-6 h-6 shrink-0 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          <span>Dourak</span>
        </Link>
        <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />
      </SidebarHeader>
      <SidebarContent>
        {session?.user && <SidebarNav schedules={schedules} />}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2">
        {session?.user ? (
          <div className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-transparent transition-all duration-300 hover:ring-primary/40 hover:scale-105 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {session.user.name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {session.user.name}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {session.user.email}
              </span>
            </div>
            <form action="/api/auth/logout" method="post" className="group-data-[collapsible=icon]:hidden">
              <button
                type="submit"
                className="group/out text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all p-2 rounded-md hover:bg-sidebar-accent press-down"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 transition-transform duration-300 group-hover/out:translate-x-0.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Link
              href="/"
              className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Sign in
            </Link>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
