import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Users,
  Truck,
  ClipboardList,
  Factory,
  DollarSign,
  FolderKanban,
  LogOut,
  User,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
      color: "text-nav-dashboard",
      bg: "bg-nav-dashboard/10",
    },
    {
      name: "Produtos",
      href: "/produtos",
      icon: Package,
      color: "text-nav-projects",
      bg: "bg-nav-projects/10",
    },
    {
      name: "Clientes",
      href: "/clientes",
      icon: Users,
      color: "text-nav-clients",
      bg: "bg-nav-clients/10",
    },
    {
      name: "Fornecedores",
      href: "/fornecedores",
      icon: Truck,
      color: "text-nav-finance",
      bg: "bg-nav-finance/10",
    },
    {
      name: locale === "fr-FR" ? "Commandes" : "Encomendas",
      href: "/encomendas",
      icon: ClipboardList,
      color: "text-nav-reports",
      bg: "bg-nav-reports/10",
    },
    {
      name: locale === "fr-FR" ? "Finance" : "Financeiro",
      href: "/financeiro",
      icon: DollarSign,
      color: "text-nav-finance",
      bg: "bg-nav-finance/10",
    },
    {
      name: locale === "fr-FR" ? "Projets" : "Projetos",
      href: "/projetos",
      icon: FolderKanban,
      color: "text-nav-projects",
      bg: "bg-nav-projects/10",
    },
  ];

  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    const userEmail = user?.email?.toLowerCase();
    const isHardcodedAdmin = userEmail === "jbento1@gmail.com" || userEmail === "admin@admin.com";

    // Prioridade máxima para Ham
    if (userEmail === "ham@admin.com") {
      return navigation.filter(
        (item) =>
          item.href === "/projetos" ||
          item.href === "/encomendas" ||
          item.href === "/produtos" ||
          item.href === "/financeiro"
      );
    }

    if (isLimitedNav(user)) {
      return navigation.filter((item) => item.href === "/produtos" || item.href === "/encomendas");
    }

    if (isHardcodedAdmin) {
      return navigation;
    }

    if (isRestrictedFR) {
      return navigation.filter(
        (item) =>
          item.href === "/encomendas" || item.href === "/financeiro" || item.href === "/projetos"
      );
    }

    if (isCollaborator) {
      return navigation.filter(
        (item) =>
          item.href === "/produtos" || item.href === "/encomendas" || item.href === "/financeiro"
      );
    }

    const allowedProjectsEmails = ["jbento1@gmail.com", "admin@admin.com"];

    return navigation.filter((item) => {
      if (item.href === "/projetos") {
        return userEmail && allowedProjectsEmails.includes(userEmail);
      }
      if (item.href === "/producao") {
        return !isRestrictedFR;
      }
      return true;
    });
  };

  const filteredNavigation = getFilteredNavigation();

  return (
    <Sidebar collapsible="icon" className="border-border bg-sidebar border-r">
      <SidebarHeader
        className={cn("relative px-4 py-5", isCollapsed && "flex items-center justify-center")}
      >
        <div
          className={cn(
            "relative flex w-full flex-col items-center transition-all duration-300",
            isCollapsed ? "justify-center" : "gap-4 pt-3"
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300",
              isCollapsed ? "gap-0" : "gap-2"
            )}
          >
            <img
              src="/logo-inove.jpg"
              alt="Gestion CHS"
              className={cn(
                "rounded-xl object-contain shadow-sm transition-all duration-300",
                isCollapsed ? "mb-3 h-10 w-10" : "h-24 w-auto hover:scale-105"
              )}
            />
            {!isCollapsed && (
              <div className="flex flex-col items-center text-center">
                <span className="font-display text-xl font-bold tracking-tight text-blue-950 dark:text-blue-100">
                  Gestion CHS
                </span>
                <span className="text-muted-foreground text-xs font-medium">Sistema de Gestão</span>
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
                className="border-border bg-sidebar hover:bg-accent hover:text-accent-foreground absolute top-8 -right-3 z-20 h-7 w-7 rounded-full border shadow-sm"
                aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isCollapsed && "rotate-180"
                  )}
                />
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
                const isActive =
                  location.pathname === item.href ||
                  (item.href === "/dashboard" && location.pathname === "/");

                return (
                  <SidebarMenuItem key={item.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "group relative h-14 transition-all duration-300",
                            isActive && "bg-[var(--sidebar-active)]",
                            isCollapsed && "justify-center"
                          )}
                        >
                          <a
                            href={item.href}
                            className={cn(
                              "flex w-full items-center gap-3",
                              isCollapsed && "justify-center"
                            )}
                          >
                            <div
                              className={cn(
                                "flex shrink-0 items-center justify-center rounded-full p-2.5 shadow-sm transition-all duration-500",
                                item.bg,
                                item.color
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            {!isCollapsed && (
                              <span
                                className={cn(
                                  "font-medium transition-all duration-300",
                                  isActive
                                    ? "text-foreground translate-x-1"
                                    : "text-muted-foreground group-hover:translate-x-1"
                                )}
                              >
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

      <SidebarFooter className="space-y-4 p-4">
        {user && (
          <div
            className={cn(
              "bg-accent/30 border-border/50 rounded-xl border p-3",
              isCollapsed && "border-transparent bg-transparent p-1"
            )}
          >
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
              <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase">
                {user.email?.substring(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex min-w-0 flex-col">
                  <span className="text-foreground truncate text-xs font-bold">
                    {user.email?.split("@")[0]}
                  </span>
                  <span className="text-muted-foreground truncate text-[10px]">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-border/50 border-t pt-2">
          <SidebarMenuButton
            onClick={handleLogout}
            className={cn(
              "hover:bg-destructive/10 hover:text-destructive h-10 rounded-lg transition-all duration-200",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Sair da Conta</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
