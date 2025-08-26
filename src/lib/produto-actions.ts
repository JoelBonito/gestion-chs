
import { supabase } from '@/integrations/supabase/client';

export const deleteProduto = async (id: string) => {
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
