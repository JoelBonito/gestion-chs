
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'admin' | 'ops' | 'client' | 'factory' | 'finance' | 'restricted_fr';

interface UserRoleContextType {
    roles: UserRole[];
    loading: boolean;
    hasRole: (role: UserRole) => boolean;
    isHardcodedAdmin: boolean;
    canEdit: () => boolean;
    refreshRoles: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoles = async () => {
        if (!user) {
            setRoles([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id);

            if (error) throw error;

            const r = (data ?? []).map(d => d.role as UserRole);
            setRoles(r);
        } catch (e) {
            console.error('[UserRoleProvider] erro lendo roles:', e);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) {
            setLoading(true);
            return;
        }

        fetchRoles();
    }, [user, authLoading]);

    const hasRole = (role: UserRole) => roles.includes(role);

    const isHardcodedAdmin =
        user?.email?.toLowerCase() === 'jbento1@gmail.com' ||
        user?.email?.toLowerCase() === 'admin@admin.com';

    const isClientFR = user?.email?.toLowerCase() === 'ham@admin.com';

    const canEdit = () => {
        if (isClientFR) return false;
        return isHardcodedAdmin || hasRole('admin') || hasRole('ops') || hasRole('finance');
    };

    return (
        <UserRoleContext.Provider
            value={{
                roles,
                loading: loading || authLoading,
                hasRole,
                isHardcodedAdmin,
                canEdit,
                refreshRoles: fetchRoles
            }}
        >
            {children}
        </UserRoleContext.Provider>
    );
}

export function useUserRoleContext() {
    const context = useContext(UserRoleContext);
    if (context === undefined) {
        throw new Error('useUserRoleContext must be used within a UserRoleProvider');
    }
    return context;
}
