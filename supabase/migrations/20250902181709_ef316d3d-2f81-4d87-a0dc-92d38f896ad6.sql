-- Corrigir a função para incluir frete no cálculo do valor_total_custo
CREATE OR REPLACE FUNCTION public.recalc_valor_total_custo_encomenda(p_encomenda uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  update public.encomendas e
  set valor_total_custo = coalesce((
    select sum(i.quantidade * coalesce(p.preco_custo,0))
    from public.itens_encomenda i
    join public.produtos p on p.id = i.produto_id
    where i.encomenda_id = p_encomenda
  ), 0) + coalesce((
    select sum(f.valor_frete)
    from public.frete_encomenda f
    where f.encomenda_id = p_encomenda
  ), 0)
  where e.id = p_encomenda;
end;
$function$;

-- Atualizar todas as encomendas para incluir o frete no valor_total_custo
DO $$
DECLARE 
    encomenda_record RECORD;
BEGIN
    FOR encomenda_record IN SELECT id FROM encomendas LOOP
        PERFORM public.recalc_valor_total_custo_encomenda(encomenda_record.id);
    END LOOP;
END $$;

-- Atualizar a trigger para incluir frete quando itens mudam
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

-- Criar trigger para quando frete_encomenda muda
CREATE OR REPLACE FUNCTION public.trg_frete_recalc_custo()
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

-- Criar triggers para frete_encomenda
DROP TRIGGER IF EXISTS trg_frete_encomenda_recalc_custo ON public.frete_encomenda;
CREATE TRIGGER trg_frete_encomenda_recalc_custo
    AFTER INSERT OR UPDATE OR DELETE ON public.frete_encomenda
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_frete_recalc_custo();