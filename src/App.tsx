import React, { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { FactoryGuard } from "@/components/FactoryGuard";
import { FelipeGuard } from "@/components/FelipeGuard";
import { AppLayout } from "@/layouts/AppLayout";
import { MobileMenu } from "@/components/MobileMenu";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AIAssistantChat } from "@/components/AIAssistantChat";
import { usePWA } from "@/hooks/usePWA";
import { TopBarActionsProvider } from "@/context/TopBarActionsContext";
import { PageLoader } from "@/components/ui/loading";
import { UserRoleProvider } from "@/contexts/UserRoleContext";

// Lazy loaded pages para otimização de bundle
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Encomendas = lazy(() => import("./pages/Encomendas"));
const Projetos = lazy(() => import("./pages/Projetos"));
const Producao = lazy(() => import("./pages/Producao"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
        <UserRoleProvider>
          <LocaleProvider>
            <TopBarActionsProvider>
              <Toaster />
              <OfflineIndicator />
              <AIAssistantChat />
              {showInstallPrompt && isInstallable && (
                <PWAInstallPrompt onDismiss={() => setShowInstallPrompt(false)} />
              )}
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="*"
                      element={
                        <AuthGuard>
                          <AppLayout>
                            <Suspense fallback={<PageLoader />}>
                              <Routes>
                                <Route
                                  path="/"
                                  element={
                                    <FelipeGuard>
                                      <FactoryGuard>
                                        <Dashboard />
                                      </FactoryGuard>
                                    </FelipeGuard>
                                  }
                                />
                                <Route
                                  path="/dashboard"
                                  element={
                                    <FelipeGuard>
                                      <FactoryGuard>
                                        <Dashboard />
                                      </FactoryGuard>
                                    </FelipeGuard>
                                  }
                                />
                                <Route path="/produtos" element={<Produtos />} />
                                <Route path="/clientes" element={<Clientes />} />
                                <Route path="/fornecedores" element={<Fornecedores />} />
                                <Route path="/encomendas" element={<Encomendas />} />
                                <Route path="/projetos" element={<Projetos />} />
                                <Route
                                  path="/producao"
                                  element={
                                    <FactoryGuard>
                                      <Producao />
                                    </FactoryGuard>
                                  }
                                />
                                <Route path="/financeiro" element={<Financeiro />} />
                                <Route path="/welcome" element={<Index />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Suspense>
                          </AppLayout>
                        </AuthGuard>
                      }
                    />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TopBarActionsProvider>
          </LocaleProvider>
        </UserRoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
