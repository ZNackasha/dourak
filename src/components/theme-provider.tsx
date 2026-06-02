"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
	theme: Theme;
	resolvedTheme: "light" | "dark";
	setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "dourak-theme";

function getSystemTheme(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): "light" | "dark" {
	const resolved = theme === "system" ? getSystemTheme() : theme;
	const root = document.documentElement;
	root.classList.toggle("dark", resolved === "dark");
	root.style.colorScheme = resolved;
	return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = React.useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

	React.useEffect(() => {
		const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
		setThemeState(stored);
		setResolvedTheme(applyTheme(stored));

		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
			if (current === "system") setResolvedTheme(applyTheme("system"));
		};
		mql.addEventListener("change", onChange);
		return () => mql.removeEventListener("change", onChange);
	}, []);

	const setTheme = React.useCallback((next: Theme) => {
		localStorage.setItem(STORAGE_KEY, next);
		setThemeState(next);
		setResolvedTheme(applyTheme(next));
	}, []);

	const value = React.useMemo(
		() => ({ theme, resolvedTheme, setTheme }),
		[theme, resolvedTheme, setTheme]
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = React.useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
	return ctx;
}
