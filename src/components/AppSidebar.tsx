import React from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
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
  const { locale, isRestrictedFR } = useLocale();
  const location = useLocation();

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
    const userEmail = user?.email;
    const isHardcodedAdmin = userEmail === 'jbento1@gmail.com' || userEmail === 'admin@admin.com';
    
    // Hardcoded admins have full access
    if (isHardcodedAdmin) {
      return items;
    }
    
    if (isRestrictedFR) {
      return items.filter(item => 
        item.url === '/encomendas' || 
        item.url === '/financeiro' ||
        item.url === '/projetos'                       
      );
    }
    
    if (isCollaborator) {
      return items.filter(item => 
        item.url === '/produtos' || 
        item.url === '/encomendas' || 
        item.url === '/financeiro'
      );
    }
    
    // Filter projetos tab for specific users only
    const allowedProjectsEmails = ['jbento1@gmail.com', 'admin@admin.com', 'ham@admin.com'];
    
    return items.filter(item => {
      if (item.url === '/projetos') {
        return userEmail && allowedProjectsEmails.includes(userEmail);
      }
      return true;
    });
  };

  const filteredItems = getFilteredItems();

  return (
    <Sidebar className={cn(className)}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url}
                        className={isActive ? "bg-primary/10 text-primary" : ""}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}