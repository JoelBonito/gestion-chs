import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Building2, 
  DollarSign,
  ShoppingBag,
  Factory,
  Box,
} from "lucide-react";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Produtos", url: "/produtos", icon: ShoppingBag },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
  { title: "Encomendas", url: "/encomendas", icon: Package },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
];

export function HorizontalNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="flex items-center gap-1 bg-background border-b border-border px-6 py-4">
      {navigationItems.map((item) => (
        <NavLink
          key={item.title}
          to={item.url}
          end
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-button"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}