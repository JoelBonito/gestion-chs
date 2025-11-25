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

  // Icon gradient mapping
  const iconGradients: Record<string, string> = {
    "/": "bg-gradient-to-br from-blue-500 to-primary",
    "/produtos": "bg-gradient-to-br from-emerald-500 to-emerald-600",
    "/clientes": "bg-gradient-to-br from-pink-500 to-pink-600",
    "/fornecedores": "bg-gradient-to-br from-orange-500 to-orange-600",
    "/encomendas": "bg-gradient-to-br from-blue-500 to-blue-600",
    "/producao": "bg-gradient-to-br from-purple-500 to-purple-600",
    "/financeiro": "bg-gradient-to-br from-lime-500 to-lime-600",
    "/projetos": "bg-gradient-to-br from-indigo-500 to-indigo-600",
  };

  return (
    <Sidebar className={cn("border-r border-border/50 bg-white", className)}>
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton 
                    asChild 
                    className="h-14 rounded-2xl hover:bg-accent/50 transition-all duration-300 hover:scale-[1.02] data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary/10 data-[active=true]:to-primary/5 data-[active=true]:border-l-4 data-[active=true]:border-primary"
                  >
                    <a href={item.url} className="flex items-center gap-4 px-4">
                      <div className={cn(
                        "p-2.5 rounded-xl shadow-icon transition-transform duration-300 hover:scale-110",
                        iconGradients[item.url]
                      )}>
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-medium text-foreground">{item.title}</span>
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