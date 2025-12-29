import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface FelipeGuardProps {
  children: ReactNode;
}

/**
 * Redireciona felipe@colaborador.com para /encomendas quando tenta acessar o dashboard
 */
export function FelipeGuard({ children }: FelipeGuardProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const isRestricted = user?.email?.toLowerCase() === 'felipe@colaborador.com' || user?.email?.toLowerCase() === 'ham@admin.com';

  useEffect(() => {
    if (!loading && isRestricted) {
      navigate('/encomendas', { replace: true });
    }
  }, [loading, isRestricted, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é usuário restrito, não mostra o conteúdo (já foi redirecionado)
  if (isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Redirecionando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}