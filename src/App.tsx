import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HorizontalNav } from "./components/HorizontalNav";
import { Box } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Encomendas from "./pages/Encomendas";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Financeiro from "./pages/Financeiro";
import Produtos from "./pages/Produtos";
import Producao from "./pages/Producao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          {/* Header com logo e título */}
          <header className="bg-background border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/59b9a327-4475-41d3-8ce8-b0d7bfb5355c.png" 
                    alt="Gestão CHS Logo" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-display font-medium text-foreground">Gestão CHS</h1>
                  <p className="text-sm text-muted-foreground font-body">Sistema de Cosméticos Capilares</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                Supabase conectado
              </div>
            </div>
          </header>
          
          {/* Navegação horizontal */}
          <HorizontalNav />
          
          {/* Conteúdo principal */}
          <main className="p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/encomendas" element={<Encomendas />} />
              <Route path="/producao" element={<Producao />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
