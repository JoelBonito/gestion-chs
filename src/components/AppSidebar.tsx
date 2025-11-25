import { useLocation, useNavigate } from "react-router-dom";
import { Home, Package, Users, Truck, ClipboardList, Factory, DollarSign, FolderKanban, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { isLimitedNav } from "@/lib/permissions";
import { useToast } from "@/hooks/use-toast";
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

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { locale, isRestrictedFR } = useLocale();
  const { toast } = useToast();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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
      gradient: "from-blue-500 to-purple-600",
      iconColor: "text-blue-500"
    },
    { 
      name: "Produtos", 
      href: "/produtos", 
      icon: Package,
      gradient: "from-emerald-500 to-emerald-600",
      iconColor: "text-emerald-500"
    },
    { 
      name: "Clientes", 
      href: "/clientes", 
      icon: Users,
      gradient: "from-pink-500 to-pink-600",
      iconColor: "text-pink-500"
    },
    { 
      name: "Fornecedores", 
      href: "/fornecedores", 
      icon: Truck,
      gradient: "from-orange-500 to-orange-600",
      iconColor: "text-orange-500"
    },
    { 
      name: locale === 'fr-FR' ? "Commandes" : "Encomendas", 
      href: "/encomendas", 
      icon: ClipboardList,
      gradient: "from-blue-500 to-blue-600",
      iconColor: "text-blue-500"
    },
    { 
      name: locale === 'fr-FR' ? "Production" : "Produção", 
      href: "/producao", 
      icon: Factory,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-purple-500"
    },
    { 
      name: locale === 'fr-FR' ? "Finance" : "Financeiro", 
      href: "/financeiro", 
      icon: DollarSign,
      gradient: "from-lime-500 to-lime-600",
      iconColor: "text-lime-500"
    },
    { 
      name: locale === 'fr-FR' ? "Projets" : "Projetos", 
      href: "/projetos", 
      icon: FolderKanban,
      gradient: "from-indigo-500 to-indigo-600",
      iconColor: "text-indigo-500"
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
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png" 
            alt="Gestion CHS" 
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "h-8 w-8 mx-auto" : "h-10 w-10"
            )}
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Gestion CHS
              </span>
              <span className="text-xs text-muted-foreground">Sistema de Gestão</span>
            </div>
          )}
        </div>
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
                            "relative transition-all duration-200 h-11",
                            isActive && "bg-gradient-to-r from-primary/10 to-primary-glow/10 border-l-2 border-primary",
                            !isActive && "hover:bg-muted/50"
                          )}
                        >
                          <a href={item.href} className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-xl transition-all duration-200",
                              isActive && `bg-gradient-to-br ${item.gradient} shadow-icon`,
                              !isActive && "bg-muted"
                            )}>
                              <Icon className={cn(
                                "h-4 w-4 transition-colors",
                                isActive ? "text-white" : item.iconColor
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

      <SidebarFooter className="p-4">
        {user && (
          <div className={cn(
            "mb-3 transition-all duration-200",
            isCollapsed ? "flex justify-center" : "flex items-center gap-2 p-3 rounded-lg bg-muted/50"
          )}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-2 rounded-full bg-gradient-to-br from-primary to-primary-glow">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {user.email}
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <div className="p-2 rounded-full bg-gradient-to-br from-primary to-primary-glow">
                  <User className="h-4 w-4 text-white" />
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
              onClick={handleLogout}
              className={cn(
                "transition-all duration-200 hover:bg-destructive/10 hover:text-destructive h-11",
                isCollapsed && "justify-center"
              )}
            >
              <div className="p-2 rounded-xl bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              {!isCollapsed && (
                <span className="font-medium">Sair</span>
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
