import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface OptimizedRoleGuardProps {
  children: ReactNode;
  blockCollaborator?: boolean;
  redirectTo?: string;
  showMessage?: boolean;
  allowedEmails?: string[];
}

export function OptimizedRoleGuard({ 
  children, 
  blockCollaborator = false, 
  redirectTo = '/produtos',
  showMessage = true,
  allowedEmails
}: OptimizedRoleGuardProps) {
  const { user, loading } = useAuth();

  // Fast check for hardcoded admin emails - no database query needed
  const isHardcodedAdmin = user?.email === 'jbento1@gmail.com' || user?.email === 'admin@admin.com';
  const isCollaborator = user?.email === 'felipe@colaborador.com';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Verificando permissões...</p>
        </CardContent>
      </Card>
    );
  }

  // If user is hardcoded admin, always allow access immediately (even with allowedEmails)
  if (isHardcodedAdmin) {
    return <>{children}</>;
  }

  // If allowedEmails is specified, check against those specific emails
  if (allowedEmails) {
    const hasAccess = user?.email && allowedEmails.includes(user.email);
    if (!hasAccess) {
      if (showMessage) {
        return (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta seção.
              </p>
            </CardContent>
          </Card>
        );
      }
      return null;
    }
    return <>{children}</>;
  }


  // If we need to block collaborator and user is collaborator, block access
  if (blockCollaborator && isCollaborator) {
    if (showMessage) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta seção.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return <>{children}</>;
}