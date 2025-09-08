import { ReactNode, useEffect } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface FactoryGuardProps {
  children: ReactNode;
  redirectTo?: string;
  showMessage?: boolean;
}

/**
 * Bloqueia usuário com papel 'factory' em áreas não permitidas.
 * Redireciona para /produtos (padrão).
 */
export function FactoryGuard({
  children,
  redirectTo = '/produtos',
  showMessage = true
}: FactoryGuardProps) {
  const { hasRole, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && hasRole('factory')) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, hasRole, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Verificando permissões…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasRole('factory')) {
    if (showMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
              <p className="text-muted-foreground">
                Usuário de fábrica não tem acesso a esta seção.
                <br />
                Redirecionando para produtos…
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
