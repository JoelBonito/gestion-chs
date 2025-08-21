
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Encomendas from "./pages/Encomendas";
import Producao from "./pages/Producao";
import Financeiro from "./pages/Financeiro";
import Frete from "./pages/Frete";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
            <AppSidebar />
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/fornecedores" element={<Fornecedores />} />
                  <Route path="/encomendas" element={<Encomendas />} />
                  <Route path="/producao" element={<Producao />} />
                  <Route path="/financeiro" element={<Financeiro />} />
                  <Route path="/frete" element={<Frete />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
