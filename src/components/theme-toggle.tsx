"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Toggle theme"
						className="relative overflow-hidden press-down hover:bg-accent/60 transition-colors"
					>
						<Sun className="size-4 rotate-0 scale-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:-rotate-180 dark:scale-0" />
						<Moon className="absolute size-4 rotate-180 scale-0 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:rotate-0 dark:scale-100" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
					<Sun className="size-4" /> Light {theme === "light" && <span className="ml-auto text-xs">✓</span>}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
					<Moon className="size-4" /> Dark {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
					<Monitor className="size-4" /> System {theme === "system" && <span className="ml-auto text-xs">✓</span>}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
