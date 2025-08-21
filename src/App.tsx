
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import UserMenu from "@/components/UserMenu";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Encomendas from "./pages/Encomendas";
import Producao from "./pages/Producao";
import Frete from "./pages/Frete";
import Financeiro from "./pages/Financeiro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <div className="border-b border-primary/10 p-4 flex justify-end">
            <UserMenu />
          </div>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/dashboard" element={
              <AuthGuard>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/produtos" element={
              <AuthGuard requiredRoles={['admin', 'ops']}>
                <AppLayout>
                  <Produtos />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/clientes" element={
              <AuthGuard requiredRoles={['admin', 'ops']}>
                <AppLayout>
                  <Clientes />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/fornecedores" element={
              <AuthGuard requiredRoles={['admin', 'ops']}>
                <AppLayout>
                  <Fornecedores />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/encomendas" element={
              <AuthGuard>
                <AppLayout>
                  <Encomendas />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/producao" element={
              <AuthGuard requiredRoles={['admin', 'ops', 'factory']}>
                <AppLayout>
                  <Producao />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/frete" element={
              <AuthGuard requiredRoles={['admin', 'ops']}>
                <AppLayout>
                  <Frete />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="/financeiro" element={
              <AuthGuard requiredRoles={['admin', 'ops']}>
                <AppLayout>
                  <Financeiro />
                </AppLayout>
              </AuthGuard>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
