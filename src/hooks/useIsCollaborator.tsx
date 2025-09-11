import { useAuth } from './useAuth';

export function useIsCollaborator() {
  const { user } = useAuth();
  
  const isCollaborator = user?.email === 'felipe@colaborador.com';
  
  return { isCollaborator };
}