import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { NavLink } from "@/components/NavLink";
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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { user } = useAuth();
  const { locale } = useLocale();
  const { open } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Produtos", url: "/produtos", icon: Package },
    { title: "Clientes", url: "/clientes", icon: Users },
    { title: "Fornecedores", url: "/fornecedores", icon: Truck },
    { title: locale === 'fr-FR' ? "Commandes" : "Encomendas", url: "/encomendas", icon: ClipboardList },
    { title: "Produção", url: "/producao", icon: Factory },
    { title: locale === 'fr-FR' ? "Finance" : "Financeiro", url: "/financeiro", icon: DollarSign },
    { title: locale === 'fr-FR' ? "Projets" : "Projetos", url: "/projetos", icon: FolderKanban },
  ];

  const getFilteredItems = () => {
    // PRIORITY 1: Usuários admin hardcoded têm acesso completo SEMPRE
    const isHardcodedAdmin = user?.email?.toLowerCase() === "jbento1@gmail.com" || 
                            user?.email?.toLowerCase() === "admin@admin.com";
    
    if (isHardcodedAdmin) {
      console.log('Admin hardcoded detectado:', user?.email);
      return items; // Retorna TODOS os itens sem qualquer filtro
    }

    // PRIORITY 2: Caso seja colaborador específico (felipe@colaborador.com)
    if (isCollaborator && user?.email?.toLowerCase() === "felipe@colaborador.com") {
      console.log('Colaborador detectado:', user?.email);
      return items.filter(item =>
        ["/produtos", "/encomendas", "/financeiro", "/projetos"].includes(item.url)
      );
    }

    // PRIORITY 3: Caso seja factory
    if (hasRole("factory")) {
      console.log('Role factory detectado:', user?.email);
      return items.filter(item =>
        ["/producao", "/encomendas", "/financeiro", "/projetos"].includes(item.url)
      );
    }

    // PRIORITY 4: Caso seja restricted_fr (como ham@admin.com)
    if (hasRole("restricted_fr") || user?.email?.toLowerCase() === "ham@admin.com") {
      console.log('Role restricted_fr detectado:', user?.email);
      return items.filter(item =>
        ["/encomendas", "/financeiro", "/projetos"].includes(item.url)
      );
    }

    // Default → retorna todos os itens para outros utilizadores
    console.log('Default access para:', user?.email);
    return items;
  };

  const filteredItems = getFilteredItems();

  return (
    <Sidebar className={cn("glass-sidebar", className)} collapsible="icon">
      <SidebarHeader className="border-b border-border/10 p-4">
        <div className="flex items-center gap-3">
          <div className="glass-item p-2 rounded-xl">
            <img 
              src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png" 
              alt="Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Gestion CHS
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {user?.email}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="group">
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className="glass-item px-3 py-3 flex items-center gap-3 group-hover:glass-item-hover transition-all duration-300"
                      activeClassName="glass-item-active"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {open && (
                        <span className="font-medium text-sm">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/10 p-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="glass-item w-full justify-start gap-3 px-3 py-3 hover:glass-item-hover transition-all duration-300"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {open && <span className="font-medium text-sm">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}