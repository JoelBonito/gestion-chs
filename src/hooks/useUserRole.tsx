import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type UserRole = 'admin' | 'ops' | 'client' | 'factory' | 'finance' | 'restricted_fr';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      setLoading(true);
      try {
        // Exemplo: tabela 'user_roles' com colunas user_id, role
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;

        const r = (data ?? []).map(d => d.role as UserRole);
        setRoles(r);
      } catch (e) {
        console.error('[useUserRole] erro lendo roles:', e);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user, authLoading]);

  const hasRole = (role: UserRole) => roles.includes(role);

  // Admin “hardcoded” (mantive os seus e-mails)
  const isHardcodedAdmin =
    user?.email === 'jbento1@gmail.com' ||
    user?.email === 'admin@admin.com';

  const canEdit = () => isHardcodedAdmin || hasRole('admin') || hasRole('ops');

  return { roles, hasRole, canEdit, loading: loading || authLoading, isHardcodedAdmin };
}
