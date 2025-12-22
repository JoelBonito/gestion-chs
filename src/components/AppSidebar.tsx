import { useLocation, useNavigate } from "react-router-dom";
import { Home, Package, Users, Truck, ClipboardList, Factory, DollarSign, FolderKanban, LogOut, User, Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { isLimitedNav } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
  const { toast } = useToast();
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isCollapsed = isMobile ? false : state === "collapsed";
  const { theme, setTheme } = useTheme();

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
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Produtos",
      href: "/produtos",
      icon: Package,
    },
    {
      name: "Clientes",
      href: "/clientes",
      icon: Users,
    },
    {
      name: "Fornecedores",
      href: "/fornecedores",
      icon: Truck,
    },
    {
      name: locale === 'fr-FR' ? "Commandes" : "Encomendas",
      href: "/encomendas",
      icon: ClipboardList,
    },
    {
      name: locale === 'fr-FR' ? "Finance" : "Financeiro",
      href: "/financeiro",
      icon: DollarSign,
    },
    {
      name: locale === 'fr-FR' ? "Projets" : "Projetos",
      href: "/projetos",
      icon: FolderKanban,
    },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    const userEmail = user?.email;
    const isHardcodedAdmin = userEmail === 'jbento1@gmail.com' || userEmail === 'admin@admin.com';

    if (isLimitedNav(user)) {
      return navigation.filter(item =>
        item.href === '/produtos' ||
        item.href === '/encomendas'
      );
    }

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

    const allowedProjectsEmails = ['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com'];

    return navigation.filter(item => {
      if (item.href === '/projetos') {
        return userEmail && allowedProjectsEmails.includes(userEmail);
      }
      if (item.href === '/producao') {
        return !isRestrictedFR;
      }
      return true;
    });
  };

  const filteredNavigation = getFilteredNavigation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className={cn("p-4 relative", isCollapsed && "flex items-center justify-center")}>
        <div className={cn("flex flex-col items-center w-full relative transition-all duration-300", isCollapsed ? "justify-center" : "gap-4 pt-2")}>
          <div className={cn("flex flex-col items-center justify-center transition-all duration-300", isCollapsed ? "gap-0" : "gap-2")}>
            <img
              src="/logo-inove.jpg"
              alt="Gestion CHS"
              className={cn(
                "transition-all duration-300 object-contain rounded-xl shadow-sm",
                isCollapsed ? "h-10 w-10 mb-2" : "h-24 w-auto hover:scale-105"
              )}
            />
            {!isCollapsed && (
              <div className="flex flex-col items-center text-center">
                <span className="text-xl font-display font-bold text-blue-950 dark:text-blue-100 tracking-tight">
                  Gestion CHS
                </span>
                <span className="text-xs text-muted-foreground font-medium">Sistema de Gestão</span>
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleSidebar}
                variant="outline"
                size="icon"
                className="absolute -right-3 top-8 z-20 h-7 w-7 rounded-full border border-border bg-sidebar shadow-sm hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expandir menu" : "Recolher menu"}
            </TooltipContent>
          </Tooltip>
        )}
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || (item.href === '/dashboard' && location.pathname === '/');

                return (
                  <SidebarMenuItem key={item.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "relative transition-colors h-12",
                            isActive && "bg-primary/10 border-l-4 border-l-primary",
                            !isActive && "hover:bg-muted",
                            isCollapsed && "justify-center"
                          )}
                        >
                          <a href={item.href} className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
                            <div className={cn(
                              "p-2 rounded-lg transition-colors",
                              isActive && "bg-primary",
                              !isActive && "bg-muted"
                            )}>
                              <Icon className={cn(
                                "transition-colors",
                                isCollapsed ? "h-6 w-6" : "h-5 w-5",
                                isActive ? "text-white" : "text-muted-foreground"
                              )} />
                            </div>
                            {!isCollapsed && (
                              <span className={cn(
                                "font-medium transition-colors",
                                isActive ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {item.name}
                              </span>
                            )}
                          </a>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="font-medium">
                          {item.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4 space-y-1">
        {user && (
          <div className={cn(
            "mb-1 transition-all duration-200",
            isCollapsed ? "flex justify-center" : "flex items-center gap-2 p-3 rounded-lg bg-muted/50"
          )}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-lg bg-primary">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {user.email}
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <div className="p-2 rounded-lg bg-primary">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {user.email}
                </span>
              </>
            )}
          </div>
        )}



        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "transition-all duration-200 hover:bg-primary/10 hover:text-primary h-10",
                isCollapsed ? "justify-center w-full" : ""
              )}
            >
              {isCollapsed ? (
                <div className="p-2 rounded-lg bg-primary/10">
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5 text-primary" />
                  ) : (
                    <Moon className="h-5 w-5 text-primary" />
                  )}
                </div>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-primary/10">
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5 text-primary" />
                    ) : (
                      <Moon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <span className="font-medium">{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
                </>
              )}
            </SidebarMenuButton>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="font-medium">
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={handleLogout}
              className={cn(
                "transition-all duration-200 hover:bg-destructive/10 hover:text-destructive h-10",
                isCollapsed ? "justify-center w-full" : ""
              )}
            >
              {isCollapsed ? (
                <div className="p-2 rounded-lg bg-destructive/10">
                  <LogOut className="h-5 w-5 text-destructive" />
                </div>
              ) : (
                <>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <LogOut className="h-5 w-5 text-destructive" />
                  </div>
                  <span className="font-medium">Sair</span>
                </>
              )}
            </SidebarMenuButton>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right" className="font-medium">
              Sair
            </TooltipContent>
          )}
        </Tooltip>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
