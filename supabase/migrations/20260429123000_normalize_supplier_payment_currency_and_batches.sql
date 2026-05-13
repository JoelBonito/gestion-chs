-- Normalize supplier payments for mixed BRL/EUR accounting and group technical rows.
-- valor_pagamento keeps the original paid amount in its moeda.
-- valor_pagamento_eur is the normalized amount used by global supplier totals.

ALTER TABLE public.pagamentos_fornecedor
  ADD COLUMN IF NOT EXISTS payment_batch_id uuid,
  ADD COLUMN IF NOT EXISTS taxa_cambio numeric,
  ADD COLUMN IF NOT EXISTS valor_pagamento_eur numeric;

CREATE INDEX IF NOT EXISTS idx_pagamentos_fornecedor_payment_batch_id
  ON public.pagamentos_fornecedor(payment_batch_id);

COMMENT ON COLUMN public.pagamentos_fornecedor.payment_batch_id
  IS 'Groups technical payment rows created by a single payment action.';
COMMENT ON COLUMN public.pagamentos_fornecedor.taxa_cambio
  IS 'BRL per EUR exchange rate used when the payment was registered.';
COMMENT ON COLUMN public.pagamentos_fornecedor.valor_pagamento_eur
  IS 'Payment amount normalized to EUR for global totals and balances.';

CREATE OR REPLACE FUNCTION public.get_brl_eur_rate()
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value jsonb;
  v_rate numeric;
BEGIN
  SELECT value INTO v_value
  FROM public.app_config
  WHERE key = 'brl_eur_rate';

  IF v_value IS NULL THEN
    RETURN 6;
  END IF;

  IF jsonb_typeof(v_value) = 'object' THEN
    v_rate := NULLIF(v_value->>'rate', '')::numeric;
  ELSE
    v_rate := NULLIF(trim(both '"' from v_value::text), '')::numeric;
  END IF;

  IF v_rate IS NULL OR v_rate <= 0 THEN
    RETURN 6;
  END IF;

  RETURN v_rate;
EXCEPTION WHEN others THEN
  RETURN 6;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_pagamento_fornecedor_currency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate numeric;
BEGIN
  IF NEW.payment_batch_id IS NULL THEN
    NEW.payment_batch_id := gen_random_uuid();
  END IF;

  IF COALESCE(NEW.moeda, 'EUR') = 'BRL' THEN
    v_rate := COALESCE(NULLIF(NEW.taxa_cambio, 0), public.get_brl_eur_rate());
    NEW.taxa_cambio := v_rate;
    NEW.valor_pagamento_eur := ROUND((COALESCE(NEW.valor_pagamento, 0) / v_rate)::numeric, 2);
  ELSE
    NEW.taxa_cambio := COALESCE(NULLIF(NEW.taxa_cambio, 0), public.get_brl_eur_rate());
    NEW.valor_pagamento_eur := ROUND(COALESCE(NEW.valor_pagamento, 0)::numeric, 2);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_normalize_pagamento_fornecedor_currency ON public.pagamentos_fornecedor;
CREATE TRIGGER trigger_normalize_pagamento_fornecedor_currency
  BEFORE INSERT OR UPDATE OF valor_pagamento, moeda, taxa_cambio, payment_batch_id
  ON public.pagamentos_fornecedor
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_pagamento_fornecedor_currency();

-- Backfill missing batch ids. Rows from the same old technical split share a batch
-- when their visible payment metadata matches.
WITH grouped AS (
  SELECT
    id,
    first_value(COALESCE(payment_batch_id, gen_random_uuid())) OVER (
      PARTITION BY encomenda_id, data_pagamento, forma_pagamento, fornecedor_id, item_tipo, moeda, COALESCE(observacoes, '')
      ORDER BY created_at, id
    ) AS batch_id
  FROM public.pagamentos_fornecedor
  WHERE payment_batch_id IS NULL
)
UPDATE public.pagamentos_fornecedor pf
SET payment_batch_id = grouped.batch_id
FROM grouped
WHERE pf.id = grouped.id;

UPDATE public.pagamentos_fornecedor pf
SET
  taxa_cambio = CASE
    WHEN COALESCE(pf.moeda, 'EUR') = 'BRL' THEN COALESCE(NULLIF(pf.taxa_cambio, 0), public.get_brl_eur_rate())
    ELSE COALESCE(NULLIF(pf.taxa_cambio, 0), public.get_brl_eur_rate())
  END,
  valor_pagamento_eur = CASE
    WHEN COALESCE(pf.moeda, 'EUR') = 'BRL'
      THEN ROUND((COALESCE(pf.valor_pagamento, 0) / COALESCE(NULLIF(pf.taxa_cambio, 0), public.get_brl_eur_rate()))::numeric, 2)
    ELSE ROUND(COALESCE(pf.valor_pagamento, 0)::numeric, 2)
  END
WHERE pf.valor_pagamento_eur IS NULL
   OR pf.taxa_cambio IS NULL;

CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encomenda_id uuid;
BEGIN
  v_encomenda_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.encomenda_id ELSE NEW.encomenda_id END;

  UPDATE public.encomendas e
  SET valor_pago_fornecedor = COALESCE((
    SELECT SUM(COALESCE(
      pf.valor_pagamento_eur,
      CASE
        WHEN COALESCE(pf.moeda, 'EUR') = 'BRL'
          THEN ROUND((COALESCE(pf.valor_pagamento, 0) / COALESCE(NULLIF(pf.taxa_cambio, 0), public.get_brl_eur_rate()))::numeric, 2)
        ELSE ROUND(COALESCE(pf.valor_pagamento, 0)::numeric, 2)
      END
    ))
    FROM public.pagamentos_fornecedor pf
    WHERE pf.encomenda_id = v_encomenda_id
  ), 0)
  WHERE e.id = v_encomenda_id;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

UPDATE public.encomendas e
SET valor_pago_fornecedor = COALESCE((
  SELECT SUM(COALESCE(
    pf.valor_pagamento_eur,
    CASE
      WHEN COALESCE(pf.moeda, 'EUR') = 'BRL'
        THEN ROUND((COALESCE(pf.valor_pagamento, 0) / COALESCE(NULLIF(pf.taxa_cambio, 0), public.get_brl_eur_rate()))::numeric, 2)
      ELSE ROUND(COALESCE(pf.valor_pagamento, 0)::numeric, 2)
    END
  ))
  FROM public.pagamentos_fornecedor pf
  WHERE pf.encomenda_id = e.id
), 0)
WHERE EXISTS (
  SELECT 1 FROM public.pagamentos_fornecedor pf WHERE pf.encomenda_id = e.id
);

-- Force saldo_devedor_fornecedor recalculation in databases where it is trigger-maintained.
UPDATE public.encomendas
SET updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM public.pagamentos_fornecedor pf WHERE pf.encomenda_id = encomendas.id
);
