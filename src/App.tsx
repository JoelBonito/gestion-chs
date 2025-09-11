
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { FactoryGuard } from "@/components/FactoryGuard";
import { FelipeGuard } from "@/components/FelipeGuard";
import { HorizontalNav } from "@/components/HorizontalNav";
import { LocaleProvider } from "@/contexts/LocaleContext";
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
import PrintEncomenda from "./pages/PrintEncomenda";
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LocaleProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="*"
                element={
                  <AuthGuard>
                    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
                      <HorizontalNav />
                      <main className="flex-1">
                        <div className="container mx-auto p-6">
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
                            <Route path="/print-encomenda" element={<PrintEncomenda />} />
                            <Route path="/welcome" element={<Index />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                      </main>
                    </div>
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
