import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Adicionamos 'restricted_fr' aos roles válidos
export type UserRole = 'admin' | 'ops' | 'client' | 'factory' | 'finance' | 'restricted_fr';

export function useUserRole() {
  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    const fetchUserRoles = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (!error && data) {
          setRoles(data.map((r: any) => r.role as UserRole));
        }
      }
    };
    fetchUserRoles();
  }, []);

  const hasRole = (role: UserRole) => roles.includes(role);

  return { roles, hasRole };
}
