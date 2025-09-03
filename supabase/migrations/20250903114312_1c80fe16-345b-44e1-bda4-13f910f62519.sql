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

-- Recalcular o valor total de custo para a encomenda ENC-2025-250
DO $$
DECLARE
    encomenda_id uuid;
BEGIN
    SELECT id INTO encomenda_id FROM public.encomendas WHERE numero_encomenda = 'ENC-2025-250';
    
    IF encomenda_id IS NOT NULL THEN
        PERFORM public.recalc_valor_total_custo_encomenda(encomenda_id);
        
        -- Atualizar saldo devedor do fornecedor
        UPDATE public.encomendas 
        SET saldo_devedor_fornecedor = valor_total_custo - valor_pago_fornecedor
        WHERE id = encomenda_id;
    END IF;
END $$;