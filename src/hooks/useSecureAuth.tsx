import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

export function useSecureAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const validateSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session validation error:", error);
          if (mounted) {
            setUser(null);
            setSessionValid(false);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          // Verify the session is still valid by making an authenticated request
          const { error: userError } = await supabase.auth.getUser();

          if (userError) {
            console.error("User validation error:", userError);
            if (mounted) {
              setUser(null);
              setSessionValid(false);
              await supabase.auth.signOut();
              toast({
                title: "Sessão expirada",
                description: "Por favor, faça login novamente",
                variant: "destructive",
              });
            }
          } else if (mounted) {
            setUser(session.user);
            setSessionValid(true);
          }
        } else if (mounted) {
          setUser(null);
          setSessionValid(false);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Session validation failed:", error);
        if (mounted) {
          setUser(null);
          setSessionValid(false);
          setLoading(false);
        }
      }
    };

    validateSession();

    // Listen for auth changes with enhanced security
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);

      if (!mounted) return;

      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (event === "SIGNED_OUT") {
          setUser(null);
          setSessionValid(false);
        } else if (session?.user) {
          setUser(session.user);
          setSessionValid(true);
        }
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        setSessionValid(true);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSessionValid(false);

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com segurança",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    loading,
    sessionValid,
    signOut,
    isAuthenticated: !!user && sessionValid,
  };
}
