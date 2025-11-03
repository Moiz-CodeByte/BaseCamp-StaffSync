"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const applyTheme = useCallback((next) => {
    setTheme(next);
    if (typeof document !== 'undefined') {
      if (next === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("theme", next);
    }
  }, []);

  useEffect(() => {
    // Sync the current theme to DOM and storage whenever it changes
    if (typeof document !== 'undefined') {
      if (theme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  return (
    <Button variant="outline" size="sm" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
      {theme === "dark" ? "Light" : "Dark"}
    </Button>
  );
}
