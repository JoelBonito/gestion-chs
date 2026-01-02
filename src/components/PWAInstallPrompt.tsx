import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useLocale } from "@/contexts/LocaleContext";

interface PWAInstallPromptProps {
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const { installPWA } = usePWA();
  const { isRestrictedFR } = useLocale();

  const handleInstall = async () => {
    await installPWA();
    onDismiss();
  };

  const t = {
    title: isRestrictedFR ? "Installer Gestion CHS" : "Instalar Gestion CHS",
    subtitle: isRestrictedFR
      ? "Accédez rapidement depuis votre écran d'accueil"
      : "Acesse rapidamente direto da sua tela inicial",
    button: isRestrictedFR ? "Installer" : "Instalar",
  };

  return (
    <Card className="border-primary/20 bg-background/95 fixed right-4 bottom-4 left-4 z-50 shadow-lg backdrop-blur-sm dark:bg-popover">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Download className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t.title}</h3>
              <p className="text-muted-foreground text-xs">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="gradient" onClick={handleInstall} className="text-xs">
              {t.button}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="group rounded-full p-2 text-xs transition-all duration-300 hover:rotate-90 hover:bg-red-500/10 hover:text-red-500"
            >
              <X className="h-4 w-4 transition-transform" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
