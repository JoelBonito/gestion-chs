import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
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
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              <header className="h-16 border-b bg-card/95 backdrop-blur-md flex items-center px-6 sticky top-0 z-40 shadow-card">
                <SidebarTrigger className="mr-4 hover:bg-secondary/80 border border-border shadow-button hover:shadow-hover transition-all duration-200" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center shadow-button">
                    <span className="text-primary-foreground font-bold text-sm">G</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">GestãoPro</h2>
                    <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
                  </div>
                </div>
              </header>
              
              <main className="flex-1 p-8 overflow-auto bg-background">
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
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
