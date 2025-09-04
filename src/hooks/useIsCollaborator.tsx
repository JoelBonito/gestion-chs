import { useAuth } from './useAuth';

export function useIsCollaborator() {
  const { user } = useAuth();
  
  return user?.email === 'felipe@colaborador.com';
}