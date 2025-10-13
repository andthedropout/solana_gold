import React, { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Helper function to determine theme based on time of day
const getTimeBasedTheme = (): "dark" | "light" => {
  const hour = new Date().getHours();
  // Dark mode from 6 PM (18:00) to 6 AM (6:00)
  // Light mode from 6 AM (6:00) to 6 PM (18:00)
  const isDarkTime = hour >= 18 || hour < 6;
  return isDarkTime ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey) as Theme;
    console.log('🎛️ ThemeProvider: Stored theme in localStorage:', stored);

    // If no stored theme or stored as "system", use time-based
    if (!stored || stored === "system") {
      const timeTheme = getTimeBasedTheme();
      console.log('🎛️ ThemeProvider: Initializing with time-based theme:', timeTheme, `(${new Date().getHours()}:00)`);
      // Don't return the actual theme, return "system" so the useEffect triggers time-based logic
      return defaultTheme;
    }

    return stored;
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      // Use time-based theme instead of system preference
      const timeBasedTheme = getTimeBasedTheme();
      console.log('🎛️ ThemeProvider: Time-based theme applied:', timeBasedTheme, `(${new Date().getHours()}:00)`);
      root.classList.add(timeBasedTheme)

      // Check every minute if we need to switch themes
      const interval = setInterval(() => {
        const newTimeBasedTheme = getTimeBasedTheme();
        root.classList.remove("light", "dark");
        root.classList.add(newTimeBasedTheme);
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }

    console.log('🎛️ ThemeProvider: Setting theme class:', theme);
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
} 