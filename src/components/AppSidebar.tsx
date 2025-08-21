import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Building2, 
  DollarSign,
  ShoppingBag,
  Home,
  Settings,
  Factory,
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
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationGroups = [
  {
    title: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Encomendas", url: "/encomendas", icon: Package },
      { title: "Produção", url: "/producao", icon: Factory },
    ]
  },
  {
    title: "Cadastros",
    items: [
      { title: "Produtos", url: "/produtos", icon: ShoppingBag },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
    ]
  },
  {
    title: "Gestão",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: DollarSign },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-button hover:shadow-hover transition-all duration-200" 
      : "px-4 py-3 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground font-medium transition-all duration-200";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-72"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-6 bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-button">
            <Home className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-sidebar-foreground">GestãoPro</h1>
              <p className="text-sm text-sidebar-foreground/70">Sistema de Gestão</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar p-4">
        {navigationGroups.map((group, index) => (
          <SidebarGroup key={group.title} className={index > 0 ? "mt-6" : ""}>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/60 uppercase tracking-wider mb-3 px-3">
                {group.title}
              </SidebarGroupLabel>
            )}
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName}
                        end
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="ml-3 font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Configurações no final */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-bold text-sidebar-foreground/60 uppercase tracking-wider mb-3 px-3">
              Sistema
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="px-4 py-3 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground font-medium transition-all duration-200">
                  <Settings className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="ml-3 font-medium">Configurações</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}