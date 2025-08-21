
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLogEntry {
  entity: string;
  entity_id: string;
  action: string;
  details?: Record<string, any>;
}

export async function logActivity({ entity, entity_id, action, details }: ActivityLogEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('activity_log')
      .insert({
        entity,
        entity_id,
        action,
        by_user: user?.id,
        details: details || null
      });

    if (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
  }
}
