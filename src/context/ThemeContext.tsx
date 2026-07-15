"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeColors = {
  background: string;
  foreground: string;
  primaryBrand: string;
  secondary: string;
  tertiary: string;
};

export const defaultThemes: Record<string, ThemeColors> = {
  "Netflix": {
    background: "#141414",
    foreground: "#ffffff",
    primaryBrand: "#e50914",
    secondary: "#b9090b",
    tertiary: "#564d4d",
  },
  "Cyberpunk": {
    background: "#0d0221",
    foreground: "#00ffcc",
    primaryBrand: "#ff00ff",
    secondary: "#00ffff",
    tertiary: "#fcee0a",
  },
  "Midnight": {
    background: "#0f172a",
    foreground: "#f8fafc",
    primaryBrand: "#3b82f6",
    secondary: "#ec4899",
    tertiary: "#8b5cf6",
  },
  "Forest": {
    background: "#052e16",
    foreground: "#ecfdf5",
    primaryBrand: "#10b981",
    secondary: "#34d399",
    tertiary: "#fbbf24",
  },
};

type ThemeContextType = {
  activeTheme: string;
  colors: ThemeColors;
  setTheme: (themeName: string) => void;
  updateColor: (key: keyof ThemeColors, value: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeTheme, setActiveThemeState] = useState<string>("Midnight");
  const [colors, setColors] = useState<ThemeColors>(defaultThemes["Midnight"]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("mflix-theme-name");
    const storedColors = localStorage.getItem("mflix-theme-colors");

    if (storedTheme) {
      setActiveThemeState(storedTheme);
    }
    if (storedColors) {
      try {
        setColors(JSON.parse(storedColors));
      } catch (e) {
        console.error("Failed to parse theme colors");
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--primary-brand", colors.primaryBrand);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--tertiary", colors.tertiary);

    localStorage.setItem("mflix-theme-name", activeTheme);
    localStorage.setItem("mflix-theme-colors", JSON.stringify(colors));
  }, [colors, activeTheme, mounted]);

  const setTheme = (themeName: string) => {
    if (defaultThemes[themeName]) {
      setActiveThemeState(themeName);
      setColors(defaultThemes[themeName]);
    }
  };

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setActiveThemeState("Custom");
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  // Prevent flash of unstyled content during SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ activeTheme, colors, setTheme, updateColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
