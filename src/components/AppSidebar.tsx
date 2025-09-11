import React from "react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Package,
  Users,
  Truck,
  ClipboardList,
  Factory,
  DollarSign,
  FolderKanban,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { hasRole } = useUserRole();
  const { isCollaborator } = useIsCollaborator();
  const { user } = useAuth();

  const items = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Produtos", url: "/produtos", icon: Package },
    { title: "Clientes", url: "/clientes", icon: Users },
    { title: "Fornecedores", url: "/fornecedores", icon: Truck },
    { title: "Encomendas", url: "/encomendas", icon: ClipboardList },
    { title: "Produção", url: "/producao", icon: Factory },
    { title: "Financeiro", url: "/financeiro", icon: DollarSign },
    { title: "Projetos", url: "/projetos", icon: FolderKanban },
  ];

  const getFilteredItems = () => {
    // Usuários admin têm acesso completo a todas as abas
    const isFullAdmin = user?.email?.toLowerCase() === "jbento1@gmail.com" || 
                       user?.email?.toLowerCase() === "admin@admin.com";
    
    if (isFullAdmin) {
      return items; // Retorna todos os itens sem filtro
    }

    // Caso seja colaborador
    if (isCollaborator) {
      return items.filter(item =>
        ["/produtos", "/encomendas", "/financeiro", "/projetos"].includes(item.url)
      );
    }

    // Caso seja factory
    if (hasRole("factory")) {
      return items.filter(item =>
        ["/producao", "/encomendas", "/financeiro", "/projetos"].includes(item.url)
      );
    }

    // Caso seja restricted_fr (como ham@admin.com)
    if (hasRole("restricted_fr") || user?.email?.toLowerCase() === "ham@admin.com") {
      return items.filter(item =>
        ["/encomendas", "/financeiro", "/projetos"].includes(item.url)
      );
    }

    // Default → retorna todos os itens
    return items;
  };

  const filteredItems = getFilteredItems();

  return (
    <Sidebar className={cn(className)}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}