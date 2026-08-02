"use client"

import { Calendar, CalendarRange, Home, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar"

const NAV_ITEMS = [
	{ title: "Home", href: "/", icon: Home },
	{ title: "Schedules", href: "/schedules", icon: CalendarRange },
	{ title: "New schedule", href: "/schedules/new", icon: Plus },
	{ title: "Settings", href: "/settings", icon: Settings },
]

export type SidebarSchedule = { id: string; name: string }

export function SidebarNav({ schedules }: { schedules: SidebarSchedule[] }) {
	const pathname = usePathname()
	const { isMobile, setOpenMobile } = useSidebar()

	// Close the sheet on mobile so navigation feels instant.
	const onNavigate = () => {
		if (isMobile) setOpenMobile(false)
	}

	const isActive = (href: string) =>
		href === "/" ? pathname === "/" : pathname === href

	return (
		<>
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						{NAV_ITEMS.map(({ title, href, icon: Icon }) => (
							<SidebarMenuItem key={href}>
								<SidebarMenuButton
									tooltip={title}
									isActive={isActive(href)}
									render={<Link href={href} onClick={onNavigate} />}
								>
									<Icon />
									<span>{title}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>

			{schedules.length > 0 && (
				<SidebarGroup>
					<SidebarGroupLabel>Your schedules</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{schedules.map((s) => (
								<SidebarMenuItem key={s.id}>
									<SidebarMenuButton
										tooltip={s.name}
										isActive={pathname.startsWith(`/schedules/${s.id}`)}
										render={
											<Link href={`/schedules/${s.id}`} onClick={onNavigate} />
										}
									>
										<Calendar />
										<span>{s.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			)}
		</>
	)
}
