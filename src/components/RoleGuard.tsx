import { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

type UserRole = "admin" | "ops" | "client" | "factory" | "finance";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { roles, loading } = useUserRole();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Verificando permissões...</p>
        </CardContent>
      </Card>
    );
  }

  const hasAllowedRole = allowedRoles.some((role) => roles.includes(role));

  if (!hasAllowedRole) {
    return (
      fallback || (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="text-warning mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta seção.
              <br />
              Roles necessárias: {allowedRoles.join(", ")}
            </p>
          </CardContent>
        </Card>
      )
    );
  }

  return <>{children}</>;
}
