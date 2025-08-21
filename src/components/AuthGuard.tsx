
import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: ('admin' | 'ops' | 'client' | 'factory')[];
}

export default function AuthGuard({ children, requiredRoles }: AuthGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && !rolesLoading && user && requiredRoles) {
      const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
      if (!hasRequiredRole) {
        navigate('/dashboard'); // Redireciona para dashboard se não tem permissão
        return;
      }
    }
  }, [user, roles, authLoading, rolesLoading, navigate, requiredRoles]);

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles) {
    const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-primary-dark mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
