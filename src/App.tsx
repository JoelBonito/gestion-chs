
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { FactoryGuard } from "@/components/FactoryGuard";
import { FelipeGuard } from "@/components/FelipeGuard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { MobileMenu } from "@/components/MobileMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePWA } from "@/hooks/usePWA";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Encomendas from "./pages/Encomendas";
import { default as Projetos } from "./pages/Projetos";
import Producao from "./pages/Producao";
import Financeiro from "./pages/Financeiro";
import NotFound from "./pages/NotFound";

// Create QueryClient instance outside component to avoid recreating on re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show install prompt after 30 seconds if installable
    const timer = setTimeout(() => {
      if (isInstallable) {
        setShowInstallPrompt(true);
      }
    }, 30000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isInstallable]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocaleProvider>
          <Toaster />
          <OfflineIndicator />
          {showInstallPrompt && isInstallable && (
            <PWAInstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
          )}
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="*"
                element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }
              />
            </Routes>
          </BrowserRouter>
        </LocaleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function AppLayout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
        {!isMobile && <AppSidebar />}
        
        <div className="flex-1 flex flex-col w-full">
          {/* Mobile Header */}
          {isMobile && (
            <header className="sticky top-0 z-40 glass-sidebar border-b border-border/20 h-16 flex items-center px-4 gap-3">
              <MobileMenu />
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png" 
                  alt="Logo" 
                  className="h-8 w-8"
                />
                <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  Gestion CHS
                </span>
              </div>
            </header>
          )}

          {/* Desktop trigger */}
          {!isMobile && (
            <header className="sticky top-0 z-40 glass-sidebar border-b border-border/20 h-14 flex items-center px-4">
              <SidebarTrigger className="glass-trigger" />
            </header>
          )}

          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <Routes>
                <Route path="/" element={
                  <FelipeGuard>
                    <FactoryGuard>
                      <Dashboard />
                    </FactoryGuard>
                  </FelipeGuard>
                } />
                <Route path="/dashboard" element={
                  <FelipeGuard>
                    <FactoryGuard>
                      <Dashboard />
                    </FactoryGuard>
                  </FelipeGuard>
                } />
                <Route path="/produtos" element={<Produtos />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/fornecedores" element={<Fornecedores />} />
                <Route path="/encomendas" element={<Encomendas />} />
                <Route path="/projetos" element={<Projetos />} />
                <Route path="/producao" element={
                  <FactoryGuard>
                    <Producao />
                  </FactoryGuard>
                } />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/welcome" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;
