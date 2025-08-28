-- Update the trigger function to recalculate when preco_custo changes
CREATE OR REPLACE FUNCTION public.trg_itens_recalc_custo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := coalesce(new.encomenda_id, old.encomenda_id);
  perform public.recalc_valor_total_custo_encomenda(v_id);
  return coalesce(new, old);
end;
$function$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_itens_recalc_custo ON public.itens_encomenda;

-- Create trigger on INSERT, UPDATE, DELETE for itens_encomenda
CREATE TRIGGER trg_itens_recalc_custo
  AFTER INSERT OR UPDATE OR DELETE ON public.itens_encomenda
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_itens_recalc_custo();