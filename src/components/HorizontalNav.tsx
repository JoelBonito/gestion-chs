
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
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenu } from "./MobileMenu";
import { cn } from "@/lib/utils";
import { isLimitedNav } from "@/lib/permissions";
import {
  Home,
  Package,
  Users,
  Truck,
  ClipboardList,
  DollarSign,
  LogOut,
  User,
  FolderKanban
} from "lucide-react";

export function HorizontalNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { toast } = useToast();
  const { locale, isRestrictedFR } = useLocale();
  const isMobile = useIsMobile();

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
    { name: "Dashboard", href: "/dashboard", icon: Home, color: "text-nav-dashboard", bg: "bg-nav-dashboard/10" },
    { name: "Produtos", href: "/produtos", icon: Package, color: "text-nav-projects", bg: "bg-nav-projects/10" },
    { name: "Clientes", href: "/clientes", icon: Users, color: "text-nav-clients", bg: "bg-nav-clients/10" },
    { name: "Fornecedores", href: "/fornecedores", icon: Truck, color: "text-nav-finance", bg: "bg-nav-finance/10" },
    { name: locale === 'fr-FR' ? "Commandes" : "Encomendas", href: "/encomendas", icon: ClipboardList, color: "text-nav-reports", bg: "bg-nav-reports/10" },
    { name: locale === 'fr-FR' ? "Projets" : "Projetos", href: "/projetos", icon: FolderKanban, color: "text-nav-projects", bg: "bg-nav-projects/10" },
    { name: locale === 'fr-FR' ? "Finance" : "Financeiro", href: "/financeiro", icon: DollarSign, color: "text-nav-finance", bg: "bg-nav-finance/10" },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    const userEmail = user?.email;
    const isHardcodedAdmin = userEmail === 'jbento1@gmail.com' || userEmail === 'admin@admin.com';

    // Rosa - navegação limitada apenas para Produtos e Encomendas
    if (isLimitedNav(user)) {
      return navigation.filter(item =>
        item.href === '/produtos' ||
        item.href === '/encomendas'
      );
    }

    // Hardcoded admins have full access
    if (isHardcodedAdmin) {
      return navigation;
    }

    if (isRestrictedFR) {
      console.log('[FR-Restricted] nav limited to orders/finance');
      return navigation.filter(item =>
        item.href === '/encomendas' ||
        item.href === '/financeiro' ||
        item.href === '/projetos'
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
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {(isMobile) && <MobileMenu />}

            {/* Logo and Brand */}
            <Link to={isLimitedNav(user) ? "/encomendas" : isRestrictedFR ? "/encomendas" : isCollaborator ? "/produtos" : "/dashboard"} className="flex items-center space-x-3">
              <img
                src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png"
                alt="Gestion CHS Logo"
                className="h-8 w-auto"
              />
              <span className="hidden sm:inline-block text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Gestion CHS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on Mobile/Tablet */}
          {!isMobile && (
            <div className="flex space-x-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 gap-3 group",
                      isActive
                        ? "bg-accent/50 text-foreground"
                        : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-full shrink-0 transition-all duration-500 flex items-center justify-center",
                      (item as any).bg,
                      (item as any).color,
                      isActive && "scale-110 shadow-lg"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Info and Actions */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User Info - Show email on larger screens, just icon on mobile */}
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="hidden lg:inline text-sm font-medium truncate max-w-[150px]">
                  {user.email}
                </span>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
