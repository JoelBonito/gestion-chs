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
  Folder,
  CreditCard,
  LogOut
} from "lucide-react";

export default function HorizontalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    setIsLoggingOut(false);
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate("/login");
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Produtos", href: "/produtos", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Fornecedores", href: "/fornecedores", icon: Factory },
    { name: locale === 'fr-FR' ? "Commandes" : "Encomendas", href: "/encomendas", icon: ShoppingCart },
    { name: locale === 'fr-FR' ? "Projets" : "Projetos", href: "/projetos", icon: Folder },
    { name: locale === 'fr-FR' ? "Finance" : "Financeiro", href: "/financeiro", icon: CreditCard },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    if (isRestrictedFR) {
      const email = user?.email?.toLowerCase();
      if (email === "ham@admin.com") {
        console.log('[FR-Restricted] override for ham@admin.com: include projets');
        return navigation.filter(item => 
          item.href === '/encomendas' || 
          item.href === '/financeiro' ||
          item.href === '/projetos'
        );
      }
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
    
    // Filter projetos tab for specific users only
    const userEmail = user?.email;
    const allowedProjectsEmails = ['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com'];
    
    return navigation.filter(item => {
      if (item.href === '/projetos') {
        return userEmail && allowedProjectsEmails.includes(userEmail);
      }
      return true;
    });
  };

  const filteredNavigation = getFilteredNavigation();

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
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

          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{user.email}</Badge>
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
      </div>
    </nav>
  );
}
