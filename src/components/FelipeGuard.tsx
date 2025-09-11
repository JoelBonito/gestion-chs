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

  useEffect(() => {
    if (!loading && user?.email?.toLowerCase() === 'felipe@colaborador.com') {
      navigate('/encomendas', { replace: true });
    }
  }, [loading, user, navigate]);

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

  // Se é felipe, não mostra o conteúdo (já foi redirecionado)
  if (user?.email?.toLowerCase() === 'felipe@colaborador.com') {
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