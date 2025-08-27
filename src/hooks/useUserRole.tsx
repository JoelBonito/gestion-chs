
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type UserRole = 'admin' | 'ops' | 'client' | 'factory' | 'finance';

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;
        setRoles(data?.map(r => r.role as UserRole) || []);
      } catch (error) {
        console.error('Erro ao carregar roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  const hasRole = (role: UserRole) => roles.includes(role);
  const canEdit = () => hasRole('admin') || hasRole('ops');

  return { roles, hasRole, canEdit, loading };
}
