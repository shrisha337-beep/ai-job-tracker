"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-1)] border border-transparent hover:border-[var(--color-border)] transition-colors cursor-pointer"
      title={mounted ? (theme === "light" ? "Switch to dark mode" : "Switch to light mode") : "Toggle theme"}
      aria-label="Toggle theme"
      id="theme-toggle-btn"
    >
      {mounted ? (
        theme === "light" ? <Moon size={16} /> : <Sun size={16} />
      ) : (
        <span className="w-4 h-4 block" />
      )}
    </button>
  );
}
