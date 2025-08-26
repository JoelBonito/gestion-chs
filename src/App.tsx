
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { HorizontalNav } from "@/components/HorizontalNav";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Encomendas from "./pages/Encomendas";
import Producao from "./pages/Producao";
import Financeiro from "./pages/Financeiro";
import Frete from "./pages/Frete";
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
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/produtos" element={<Produtos />} />
                          <Route path="/clientes" element={<Clientes />} />
                          <Route path="/fornecedores" element={<Fornecedores />} />
                          <Route path="/encomendas" element={<Encomendas />} />
                          <Route path="/producao" element={<Producao />} />
                          <Route path="/financeiro" element={<Financeiro />} />
                          <Route path="/frete" element={<Frete />} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
