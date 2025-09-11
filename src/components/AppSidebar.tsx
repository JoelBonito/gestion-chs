import { Home, Package, Users, Building2, ShoppingCart, Factory, Calculator } from "lucide-react";
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
import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useAuth } from "@/hooks/useAuth";

const getItems = (isHamAdmin: boolean) => [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Produtos",
    url: "/produtos",
    icon: Package,
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: Users,
  },
  {
    title: "Fornecedores",
    url: "/fornecedores",
    icon: Building2,
  },
  {
    title: isHamAdmin ? "Commandes" : "Encomendas",
    url: "/encomendas",
    icon: ShoppingCart,
  },
  {
    title: isHamAdmin ? "Projet" : "Projetos",
    url: "/projetos",
    icon: Factory,
  },
  {
    title: isHamAdmin ? "Production" : "Produção",
    url: "/producao",
    icon: Factory,
  },
  {
    title: isHamAdmin ? "Financier" : "Financeiro",
    url: "/financeiro",
    icon: Calculator,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { hasRole } = useUserRole();
  const isCollaborator = useIsCollaborator();
  const { user } = useAuth();
  
  const isHamAdmin = user?.email === 'ham@admin.com';
  const items = getItems(isHamAdmin);

  // Filter items based on user role
  const getFilteredItems = () => {
    // Check if user has access to Projects tab
    const hasProjectsAccess = user?.email === 'jbento1@gmail.com' || 
                              user?.email === 'admin@admin.com' || 
                              user?.email === 'ham@admin.com';

    if (isCollaborator) {
      const allowedUrls = ['/produtos', '/encomendas', '/financeiro'];
      if (hasProjectsAccess) allowedUrls.push('/projetos');
      return items.filter(item => allowedUrls.includes(item.url));
    }
    
    if (hasRole('factory')) {
      const allowedUrls = ['/produtos', '/encomendas', '/financeiro'];
      if (hasProjectsAccess) allowedUrls.push('/projetos');
      return items.filter(item => allowedUrls.includes(item.url));
    }
    
    return items;
  };

  const filteredItems = getFilteredItems();

  return (
    <Sidebar>
      <SidebarContent className="bg-gradient-to-b from-primary/5 via-background to-background border-r border-primary/10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-dark font-display font-medium text-base px-4 py-6">
            Sistema de Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2">
              {filteredItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      className={`transition-all duration-300 hover:bg-primary/10 hover:text-primary-dark ${
                        isActive 
                          ? 'bg-gradient-primary text-white shadow-hover border-primary/20' 
                          : 'text-muted-foreground hover:text-primary-dark'
                      }`}
                    >
                      <a href={item.url} className="flex items-center gap-3 px-4 py-3 rounded-lg font-body font-medium">
                        <item.icon className="h-5 w-5" />
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
