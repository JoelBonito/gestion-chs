import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsCollaborator } from '@/hooks/useIsCollaborator';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface RoleBasedGuardProps {
  children: ReactNode;
  blockCollaborator?: boolean;
  redirectTo?: string;
  showMessage?: boolean;
}

export function RoleBasedGuard({ 
  children, 
  blockCollaborator = false, 
  redirectTo = '/produtos',
  showMessage = true 
}: RoleBasedGuardProps) {
  const { isCollaborator } = useIsCollaborator();
  const { user } = useAuth();

  // Administradores têm acesso total sempre
  const isHardcodedAdmin = user?.email === 'jbento1@gmail.com' || user?.email === 'admin@admin.com';
  
  if (isHardcodedAdmin) {
    return <>{children}</>;
  }

  if (blockCollaborator && isCollaborator) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    
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