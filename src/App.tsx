
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { FactoryGuard } from "@/components/FactoryGuard";
import { FelipeGuard } from "@/components/FelipeGuard";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { MobileMenu } from "@/components/MobileMenu";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
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
  const { isInstallable } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Show install prompt after 30 seconds if installable
    const timer = setTimeout(() => {
      if (isInstallable) {
        setShowInstallPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
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
                    <SidebarProvider defaultOpen={true}>
                      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
                        <AppSidebar />
                        <SidebarInset>
                          <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-6">
                            <SidebarTrigger className="ml-0" />
                            <div className="flex-1" />
                            <MobileMenu />
                          </header>
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
                        </SidebarInset>
                      </div>
                    </SidebarProvider>
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

export default App;
