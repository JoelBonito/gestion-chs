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
  SidebarGroupLabel,
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
    { title: "Projetos", url: "/projetos", icon: FolderKanban }, // Novo item adicionado
  ];

  const getFilteredItems = () => {
    if (isCollaborator) {
      return items.filter(
        (item) =>
          item.url === "/produtos" ||
          item.url === "/encomendas" ||
          item.url === "/financeiro" ||
          item.url === "/projetos"
      );
    }

    if (hasRole("factory")) {
      return items.filter(
        (item) =>
          item.url === "/producao" ||
          item.url === "/encomendas" ||
          item.url === "/financeiro" ||
          item.url === "/projetos"
      );
    }

    if (user?.email?.toLowerCase() === "ham@admin.com") {
      return items.filter(
        (item) =>
          item.url === "/encomendas" ||
          item.url === "/financeiro" ||
          item.url === "/projetos"
      );
    }

    return items;
  };

  return (
    <Sidebar className={cn(className)}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getFilteredItems().map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
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
