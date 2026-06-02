"use client";

import { HelpCircle, BookOpen, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HelpMenu() {
	const openTour = () => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new CustomEvent("dourak:open-tour"));
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Help & onboarding"
						className="press-down hover:bg-accent/60 transition-colors"
					>
						<HelpCircle className="size-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Help & tips</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={openTour} className="gap-2 cursor-pointer">
					<Sparkles className="size-4 text-primary" />
					<div className="flex flex-col">
						<span>Show me around</span>
						<span className="text-[10px] text-muted-foreground">
							Re-play the walkthrough
						</span>
					</div>
				</DropdownMenuItem>
				<DropdownMenuItem
					render={
						<a
							href="https://github.com/ZNackasha/dourak#readme"
							target="_blank"
							rel="noreferrer"
							className="gap-2"
						/>
					}
				>
					<BookOpen className="size-4" />
					Documentation
				</DropdownMenuItem>
				<DropdownMenuItem
					render={
						<a
							href="mailto:support@dourak.app?subject=Dourak%20feedback"
							className="gap-2"
						/>
					}
				>
					<Mail className="size-4" />
					Send feedback
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
