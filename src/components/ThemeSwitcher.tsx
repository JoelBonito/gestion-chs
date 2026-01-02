import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="group text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--primary)] hover:ring-2 hover:ring-[var(--primary)] hover:ring-offset-2 hover:ring-offset-[var(--background)]"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 transition-transform duration-500 group-hover:rotate-90" />
      ) : (
        <Moon className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12" />
      )}
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "focus:ring-primary focus:ring-offset-background relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none",
        isDark ? "bg-muted" : "bg-border",
        className
      )}
    >
      <span className="sr-only">Alternar tema</span>
      <span
        className={cn(
          "flex inline-block h-6 w-6 transform items-center justify-center rounded-full bg-white text-xs shadow-md transition-transform duration-200",
          isDark ? "translate-x-7" : "translate-x-1"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-indigo-600" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-orange-500" />
        )}
      </span>
    </button>
  );
};
