/**
 * ThemeSwitcherPill - Toggle Dark/Light Mode Premium
 * Design: Pill com Sol e Lua lado a lado, indicador circular animado
 * Referência: Imagem fornecida pelo usuário
 */
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeSwitcherPillProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ThemeSwitcherPill({ className, size = "md" }: ThemeSwitcherPillProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const sizeClasses = {
    sm: {
      container: "h-8 w-16 p-0.5",
      indicator: "h-7 w-7",
      icon: "h-3.5 w-3.5",
      iconContainer: "h-7 w-7",
    },
    md: {
      container: "h-10 w-20 p-1",
      indicator: "h-8 w-8",
      icon: "h-4 w-4",
      iconContainer: "h-8 w-8",
    },
    lg: {
      container: "h-12 w-24 p-1",
      indicator: "h-10 w-10",
      icon: "h-5 w-5",
      iconContainer: "h-10 w-10",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out",
        "focus-visible:ring-primary focus-visible:ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        // Fundo do pill
        // Fundo do pill
        "bg-muted border-border border shadow-inner",
        sizes.container,
        className
      )}
    >
      {/* Container dos ícones */}
      <div className="relative flex w-full items-center justify-between">
        {/* Sol (esquerda) */}
        <div
          className={cn(
            "z-10 flex items-center justify-center rounded-full transition-all duration-300",
            sizes.iconContainer,
            !isDark ? "text-amber-500" : "text-muted-foreground"
          )}
        >
          <SunIcon
            className={cn(sizes.icon, "transition-transform duration-300", !isDark && "scale-110")}
          />
        </div>

        {/* Lua (direita) */}
        <div
          className={cn(
            "z-10 flex items-center justify-center rounded-full transition-all duration-300",
            sizes.iconContainer,
            isDark ? "text-blue-300" : "text-muted-foreground"
          )}
        >
          <MoonIcon
            className={cn(sizes.icon, "transition-transform duration-300", isDark && "scale-110")}
          />
        </div>
      </div>

      {/* Indicador circular animado (background do ícone ativo) */}
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
          sizes.indicator,
          isDark
            ? "bg-background border-border right-0.5 left-auto border shadow-lg"
            : "bg-background border-border right-auto left-0.5 border shadow-md"
        )}
      />
    </button>
  );
}

// Ícone do Sol
function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

// Ícone da Lua com estrelas
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      {/* Estrelinhas decorativas */}
      <circle cx="17" cy="5" r="0.5" fill="currentColor" />
      <circle cx="20" cy="9" r="0.3" fill="currentColor" />
      <circle cx="18" cy="7" r="0.2" fill="currentColor" />
    </svg>
  );
}

export default ThemeSwitcherPill;
