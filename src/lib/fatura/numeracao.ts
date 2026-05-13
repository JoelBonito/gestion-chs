import { supabase } from "@/integrations/supabase/client";

export async function getProximaSequencia(
  ano: number,
  numero_serie: string = 'INV'
): Promise<number> {
  const { data, error } = await supabase
    .from('faturas_emitidas')
    .select('sequencia')
    .eq('numero_serie', numero_serie)
    .eq('ano', ano)
    .order('sequencia', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.sequencia ?? 0) + 1;
}

export function formatarNumeroCompleto(
  numero_serie: string,
  ano: number,
  sequencia: number
): string {
  if (numero_serie === 'INV') {
    return `${numero_serie} ${ano}/${String(sequencia).padStart(3, '0')}`;
  }
  return `${numero_serie} ${ano}/${sequencia}`;
}
