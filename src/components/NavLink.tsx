import { Link, useLocation, LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
}

export function NavLink({ 
  to, 
  className, 
  activeClassName = "active", 
  end = false,
  children,
  ...props 
}: NavLinkProps) {
  const location = useLocation();
  
  const isActive = end 
    ? location.pathname === to 
    : location.pathname.startsWith(to.toString());

  return (
    <Link
      to={to}
      className={cn(className, isActive && activeClassName)}
      {...props}
    >
      {children}
    </Link>
  );
}
