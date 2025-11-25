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