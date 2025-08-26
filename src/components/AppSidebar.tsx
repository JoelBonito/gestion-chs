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

const items = [
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
    title: "Encomendas",
    url: "/encomendas",
    icon: ShoppingCart,
  },
  {
    title: "Produção",
    url: "/producao",
    icon: Factory,
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: Calculator,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent className="bg-gradient-to-b from-primary/5 via-background to-background border-r border-primary/10">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-dark font-display font-medium text-base px-4 py-6">
            Sistema de Gestão
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-2">
              {items.map((item) => {
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
