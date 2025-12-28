import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onDismiss }) => {
  const { installPWA } = usePWA();

  const handleInstall = async () => {
    await installPWA();
    onDismiss();
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-primary/20 bg-background/95 dark:bg-[#252a36] backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Instalar Gestion CHS</h3>
              <p className="text-xs text-muted-foreground">
                Acesse rapidamente direto da sua tela inicial
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="gradient"
              onClick={handleInstall}
              className="text-xs"
            >
              Instalar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="text-xs p-2 rounded-full hover:bg-red-500/10 hover:text-red-500 hover:rotate-90 transition-all duration-300 group"
            >
              <X className="h-4 w-4 transition-transform" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};