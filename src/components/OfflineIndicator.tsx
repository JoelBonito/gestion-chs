import React from "react";
import { WifiOff, Wifi } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const { isRestrictedFR } = useLocale();

  if (isOnline) return null;

  return (
    <div
      className={cn(
        "bg-destructive text-destructive-foreground fixed top-0 right-0 left-0 z-50",
        "px-4 py-2 text-center text-sm font-medium",
        "animate-in slide-in-from-top-2 duration-300"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>
          {isRestrictedFR
            ? "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées."
            : "Você está offline. Algumas funcionalidades podem estar limitadas."}
        </span>
      </div>
    </div>
  );
};
