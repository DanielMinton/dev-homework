"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-secondary/50 w-10 h-10" aria-label="Toggle theme">
        <span className="sr-only">Loading theme</span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isDark ? (
          <Moon className="h-5 w-5 text-foreground" />
        ) : (
          <Sun className="h-5 w-5 text-foreground" />
        )}
      </motion.div>
    </motion.button>
  );
}
