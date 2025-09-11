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
import { Sidebar } from "@/components/ui/sidebar";

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
    { title: "Projetos", url: "/projetos", icon: FolderKanban }, // <-- Adicionado Projetos
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

    // Exceção para ham@admin.com (mesmo com restrição FR)
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

  return <Sidebar className={cn(className)} items={getFilteredItems()} />;
}
