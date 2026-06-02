import * as React from "react"
import { Calendar, Home, LogOut } from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth, signOut } from "@/auth"

export async function AppSidebar() {
  const session = await auth()

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <Link href="/" className="text-xl font-bold text-primary tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Calendar className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
          <span>Dourak</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {session?.user && (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Home" render={<Link href="/" />}>
                    <Home />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Schedules" render={<Link href="/schedules" />}>
                    <Calendar />
                    <span>Schedules</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        {session?.user ? (
          <div className="flex items-center gap-3 w-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {session.user.name?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {session.user.name}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {session.user.email}
              </span>
            </div>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/" })
              }}
            >
              <button
                type="submit"
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors p-2 rounded-md hover:bg-sidebar-accent"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
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
    </Sidebar>
  )
}
