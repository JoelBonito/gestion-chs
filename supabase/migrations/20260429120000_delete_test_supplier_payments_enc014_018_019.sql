-- Data cleanup requested after testing grouped supplier payments.
-- Safety gate: only delete if the expected number of payments exists per order.
DO $$
DECLARE
  v_enc019_count integer;
  v_enc018_count integer;
  v_enc014_count integer;
  v_deleted_count integer;
BEGIN
  SELECT count(*) INTO v_enc019_count
  FROM public.pagamentos_fornecedor pf
  JOIN public.encomendas e ON e.id = pf.encomenda_id
  WHERE e.numero_encomenda = 'ENC019';

  SELECT count(*) INTO v_enc018_count
  FROM public.pagamentos_fornecedor pf
  JOIN public.encomendas e ON e.id = pf.encomenda_id
  WHERE e.numero_encomenda = 'ENC018';

  SELECT count(*) INTO v_enc014_count
  FROM public.pagamentos_fornecedor pf
  JOIN public.encomendas e ON e.id = pf.encomenda_id
  WHERE e.numero_encomenda = 'ENC014';

  IF v_enc019_count <> 1 OR v_enc018_count <> 2 OR v_enc014_count <> 1 THEN
    RAISE EXCEPTION
      'Unexpected payment counts. ENC019=%, ENC018=%, ENC014=%',
      v_enc019_count,
      v_enc018_count,
      v_enc014_count;
  END IF;

  DELETE FROM public.pagamentos_fornecedor pf
  USING public.encomendas e
  WHERE e.id = pf.encomenda_id
    AND e.numero_encomenda IN ('ENC019', 'ENC018', 'ENC014');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count <> 4 THEN
    RAISE EXCEPTION 'Expected to delete 4 supplier payments, deleted %', v_deleted_count;
  END IF;
END $$;
