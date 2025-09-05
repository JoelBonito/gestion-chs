
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/contexts/LocaleContext";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Factory, 
  ShoppingCart, 
  CreditCard,
  LogOut,
  User
} from "lucide-react";

export function HorizontalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { toast } = useToast();
  const { locale, isRestrictedFR } = useLocale();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Produtos", href: "/produtos", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Fornecedores", href: "/fornecedores", icon: Factory },
    { name: locale === 'fr-FR' ? "Commandes" : "Encomendas", href: "/encomendas", icon: ShoppingCart },
    { name: locale === 'fr-FR' ? "Finance" : "Financeiro", href: "/financeiro", icon: CreditCard },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    if (isRestrictedFR) {
      console.log('[FR-Restricted] nav limited to orders/finance');
      return navigation.filter(item => 
        item.href === '/encomendas' || 
        item.href === '/financeiro'
      );
    }
    if (isCollaborator) {
      return navigation.filter(item => 
        item.href === '/produtos' || 
        item.href === '/encomendas' || 
        item.href === '/financeiro'
      );
    }
    return navigation;
  };

  const filteredNavigation = getFilteredNavigation();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-8">
            <Link to={isRestrictedFR ? "/encomendas" : isCollaborator ? "/produtos" : "/dashboard"} className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png" 
                alt="Gestion CHS Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Gestion CHS
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
