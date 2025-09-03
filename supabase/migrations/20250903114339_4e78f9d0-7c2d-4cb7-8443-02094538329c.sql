-- Corrigir a função de recálculo do valor total de custo
-- A função deve usar preco_custo da tabela itens_encomenda, não da tabela produtos
CREATE OR REPLACE FUNCTION public.recalc_valor_total_custo_encomenda(p_encomenda uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.encomendas e
  set valor_total_custo = coalesce((
    select sum(i.quantidade * i.preco_custo)
    from public.itens_encomenda i
    where i.encomenda_id = p_encomenda
  ), 0)
  where e.id = p_encomenda;
end;
$function$