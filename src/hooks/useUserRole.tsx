
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type UserRole = 'admin' | 'ops' | 'client' | 'factory' | 'finance';

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
      try {
        setLoading(true);
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
  }, [user, authLoading]);

  const hasRole = (role: UserRole) => roles.includes(role);
  
  // Check if user is a hardcoded admin email
  const isHardcodedAdmin = user?.email === 'jbento1@gmail.com' || user?.email === 'admin@admin.com';
  
  const canEdit = () => isHardcodedAdmin || hasRole('admin') || hasRole('ops');

  return { roles, hasRole, canEdit, loading: loading || authLoading, isHardcodedAdmin };
}
