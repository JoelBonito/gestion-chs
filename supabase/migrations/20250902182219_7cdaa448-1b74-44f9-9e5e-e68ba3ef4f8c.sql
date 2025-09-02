-- Corrigir o preço de custo do produto PRODUCTION JOEL MIRAMAS para 0
UPDATE produtos 
SET preco_custo = 0 
WHERE nome = 'PRODUCTION JOEL MIRAMAS';

-- Recalcular os custos de todas as encomendas que usam este produto
DO $$
DECLARE 
    encomenda_record RECORD;
BEGIN
    FOR encomenda_record IN 
        SELECT DISTINCT e.id 
        FROM encomendas e
        JOIN itens_encomenda i ON e.id = i.encomenda_id
        JOIN produtos p ON i.produto_id = p.id
        WHERE p.nome = 'PRODUCTION JOEL MIRAMAS'
    LOOP
        PERFORM public.recalc_valor_total_custo_encomenda(encomenda_record.id);
    END LOOP;
END $$;