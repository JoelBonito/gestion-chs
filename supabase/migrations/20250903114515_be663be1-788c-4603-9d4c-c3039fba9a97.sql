-- Corrigir o trigger que atualiza automaticamente os valores de custo
-- quando há mudanças nos produtos
CREATE OR REPLACE FUNCTION public.trg_produto_custo_propag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'UPDATE' and new.preco_custo is distinct from old.preco_custo then
    -- Não fazer nada quando o preço de custo do produto muda
    -- porque agora usamos o preco_custo dos itens da encomenda
    null;
  end if;
  return new;
end;
$function$