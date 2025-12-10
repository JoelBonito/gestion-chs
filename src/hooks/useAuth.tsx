
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial user - só seta loading=false quando isso terminar
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    });

    // Listen for auth changes - NÃO seta loading aqui
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        // Só seta loading=false se já tiver terminado o getUser inicial
        // (que já setou loading=false)
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
