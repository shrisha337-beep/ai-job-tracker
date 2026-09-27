"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [theme, setThemeState] = useState<Theme>("light");
  const [initialized, setInitialized] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    // First, check localStorage for immediate apply (prevents flash)
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      applyThemeToDOM(stored);
    }
    setInitialized(true);
  }, []);

  // When session loads, sync from database preference
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetch("/api/user/theme")
        .then((res) => res.json())
        .then((data) => {
          if (data.theme === "light" || data.theme === "dark") {
            setThemeState(data.theme);
            applyThemeToDOM(data.theme);
            localStorage.setItem("theme", data.theme);
          }
        })
        .catch(() => {
          // Silently fail — localStorage value is already applied
        });
    }
  }, [status, session]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
      localStorage.setItem("theme", newTheme);

      // Persist to database if authenticated
      if (status === "authenticated") {
        fetch("/api/user/theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: newTheme }),
        }).catch(() => {
          // Silently fail — localStorage is the fallback
        });
      }
    },
    [status]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  // Prevent flash by not rendering until initialized
  if (!initialized) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
