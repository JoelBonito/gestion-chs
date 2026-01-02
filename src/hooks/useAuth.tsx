import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial user - só seta loading=false quando isso terminar
    const initAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          // Se der erro (ex: refresh token inválido), limpamos o usuário
          // console.error("Erro ao carregar usuário inicial:", error);
          if (mounted) setUser(null);
        } else {
          if (mounted) setUser(user);
        }
      } catch (error) {
        // Erro catastrófico
        console.error("Erro crítico de auth:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);

        // Se for SIGN_OUT, garantir loading false
        if (event === "SIGNED_OUT") {
          setLoading(false);
          // Limpar query cache se necessário, mas aqui só lidamos com auth state
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
