-- Adicionar registros de frete para as encomendas que estão com valores incorretos
INSERT INTO public.frete_encomenda (encomenda_id, valor_frete, peso_total, descricao)
SELECT 
  e.id,
  CASE 
    WHEN e.numero_encomenda = 'ENC-2025-612' THEN 1195.50
    WHEN e.numero_encomenda = 'ENC-2025-377' THEN 624.40
  END as valor_frete,
  5.0 as peso_total,
  'FRETE SÃO PAULO - MARSELHA' as descricao
FROM public.encomendas e
WHERE e.numero_encomenda IN ('ENC-2025-612', 'ENC-2025-377')
AND NOT EXISTS (
  SELECT 1 FROM public.frete_encomenda f 
  WHERE f.encomenda_id = e.id
);