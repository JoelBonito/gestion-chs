-- Corrigir as funções para ter search_path adequado (já estava correto, mas adicionando para garantir)
CREATE OR REPLACE FUNCTION public.trg_produto_custo_propag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'UPDATE' and new.preco_custo is distinct from old.preco_custo then
    update public.encomendas e
    set valor_total_custo = coalesce((
      select sum(i.quantidade * coalesce(p.preco_custo,0))
      from public.itens_encomenda i
      join public.produtos p on p.id = i.produto_id
      where i.encomenda_id = e.id
    ), 0) + coalesce((
      select sum(f.valor_frete)
      from public.frete_encomenda f
      where f.encomenda_id = e.id
    ), 0)
    where exists (
      select 1 from public.itens_encomenda i
      where i.encomenda_id = e.id and i.produto_id = new.id
    );
  end if;
  return new;
end;
$function$;