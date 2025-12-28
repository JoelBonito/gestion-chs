import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Package, Users, Truck, DollarSign, ClipboardList, FolderKanban, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { isLimitedNav } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
      });
      navigate("/login");
      setOpen(false);
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
    { name: locale === 'fr-FR' ? "Projetos" : "Projetos", href: "/projetos", icon: FolderKanban, color: "text-nav-projects", bg: "bg-nav-projects/10" },
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

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="xl:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader className="space-y-3">
          <div className="flex items-center space-x-3">
            <img
              src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png"
              alt="Gestion CHS Logo"
              className="h-8 w-auto"
            />
            <SheetTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Gestion CHS
            </SheetTitle>
          </div>

          {user && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium truncate">{user.email}</span>
              </div>
            </div>
          )}
        </SheetHeader>

        <nav className="mt-6 space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 gap-4 group",
                  isActive
                    ? "bg-accent/50 text-foreground"
                    : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-full shrink-0 transition-all duration-500 flex items-center justify-center",
                  (item as any).bg,
                  (item as any).color,
                  isActive && "scale-110 shadow-lg"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}