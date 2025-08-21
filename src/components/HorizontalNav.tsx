
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
    <nav className="flex items-center justify-between bg-background border-b border-border px-6 py-4">
      {/* Logo/Brand Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-primary font-display">CHS</h1>
          <span className="text-xs text-muted-foreground font-body">Cosméticos Capilares</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center gap-1">
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
      </div>
    </nav>
  );
}
