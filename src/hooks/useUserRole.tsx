import { useUserRoleContext } from "@/contexts/UserRoleContext";

export type UserRole = "admin" | "ops" | "client" | "factory" | "finance" | "restricted_fr";

export function useUserRole() {
  const context = useUserRoleContext();

  return {
    roles: context.roles,
    hasRole: context.hasRole,
    canEdit: context.canEdit,
    loading: context.loading,
    isHardcodedAdmin: context.isHardcodedAdmin,
    refreshRoles: context.refreshRoles,
  };
}
