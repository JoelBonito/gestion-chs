import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HorizontalNav from "./components/HorizontalNav";
import Dashboard from "./pages/Dashboard";
import Produtos from "./pages/Produtos";
import Clientes from "./pages/Clientes";
import Encomendas from "./pages/Encomendas";
import Financeiro from "./pages/Financeiro";
import Configuracoes from "./pages/Configuracoes";
import AuthGuard from "./components/AuthGuard";
import FactoryGuard from "./components/FactoryGuard";
import { supabase } from "./integrations/supabase/client";
import Login from "./pages/Login";

// ✅ Import da página de novo produto
import ProdutoNovo from "./pages/ProdutoNovo";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Carregando…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <AuthGuard>
            <HorizontalNav>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/produtos"
                  element={
                    <FactoryGuard>
                      <Produtos />
                    </FactoryGuard>
                  }
                />
                {/* ✅ Rota adicionada */}
                <Route
                  path="/produtos/novo"
                  element={
                    <FactoryGuard>
                      <ProdutoNovo />
                    </FactoryGuard>
                  }
                />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/encomendas" element={<Encomendas />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
              </Routes>
            </HorizontalNav>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

export default App;
