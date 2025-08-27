import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface FactoryGuardProps {
  children: ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

export function FactoryGuard({ children, redirectTo = '/produtos', showMessage = true }: FactoryGuardProps) {
  const { hasRole, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && hasRole('factory')) {
      navigate(redirectTo);
    }
  }, [hasRole, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Verificando permissões...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasRole('factory')) {
    if (showMessage) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Usuário de fábrica não tem acesso a esta seção.
              <br />
              Redirecionando para produtos...
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return <>{children}</>;
}