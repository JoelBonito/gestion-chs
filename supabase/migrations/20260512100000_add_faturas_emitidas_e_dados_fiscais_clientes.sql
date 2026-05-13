-- ============================================================================
-- Faturas Emitidas + Dados Fiscais de Clientes
-- ----------------------------------------------------------------------------
-- Prepara o schema para emissão de faturas PDF dentro do sistema:
--   1. Adiciona dados fiscais à tabela `clientes`
--   2. Cria tabela `faturas_emitidas` (registro imutável da fatura emitida)
--   3. Adiciona link reverso em `invoices` (anexos financeiros)
--   4. Cria bucket Storage `faturas-emitidas` (privado) + políticas RLS
--   5. Habilita RLS e políticas em `faturas_emitidas`
--   6. Cria índices auxiliares
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Dados fiscais em clientes (todos nullable)
-- ----------------------------------------------------------------------------
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS nome_social     TEXT,
  ADD COLUMN IF NOT EXISTS nif             TEXT,
  ADD COLUMN IF NOT EXISTS codigo_cliente  TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal   TEXT,
  ADD COLUMN IF NOT EXISTS cidade          TEXT,
  ADD COLUMN IF NOT EXISTS pais            TEXT DEFAULT 'Portugal';


-- ----------------------------------------------------------------------------
-- 2. Tabela faturas_emitidas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faturas_emitidas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_serie         TEXT NOT NULL DEFAULT 'FT',
  ano                  INT  NOT NULL,
  sequencia            INT  NOT NULL,
  numero_completo      TEXT NOT NULL, -- ex: "FT 2025/49"
  cliente_id           UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  snapshot_cliente     JSONB NOT NULL, -- snapshot imutável dos dados fiscais
  data_emissao         DATE NOT NULL,
  data_vencimento      DATE NOT NULL,
  condicoes_pagamento  TEXT DEFAULT 'Pronto Pagamento',
  moeda                TEXT DEFAULT 'Euro',
  linhas               JSONB NOT NULL, -- [{produto_id, descricao, preco, qtd, unidade, desconto, iva, nota_isencao, subtotal}]
  totais               JSONB NOT NULL, -- {subtotal_sem_iva, desconto_comercial, desconto_financeiro, total_sem_iva, total_iva, total_pagar}
  resumo_iva           JSONB NOT NULL, -- [{taxa, valor}]
  pdf_storage_path     TEXT,
  invoice_id           UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES auth.users(id),
  CONSTRAINT faturas_emitidas_serie_ano_seq_unique UNIQUE (numero_serie, ano, sequencia)
);


-- ----------------------------------------------------------------------------
-- 3. Link reverso em invoices
-- ----------------------------------------------------------------------------
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS fatura_emitida_id UUID
    REFERENCES public.faturas_emitidas(id) ON DELETE SET NULL;


-- ----------------------------------------------------------------------------
-- 4. Bucket Storage privado + políticas RLS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('faturas-emitidas', 'faturas-emitidas', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: apenas autenticados
DROP POLICY IF EXISTS "faturas_emitidas_storage_select" ON storage.objects;
CREATE POLICY "faturas_emitidas_storage_select"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'faturas-emitidas'
  AND auth.uid() IS NOT NULL
);

-- INSERT: apenas autenticados
DROP POLICY IF EXISTS "faturas_emitidas_storage_insert" ON storage.objects;
CREATE POLICY "faturas_emitidas_storage_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'faturas-emitidas'
  AND auth.uid() IS NOT NULL
);

-- UPDATE: admins ou criador
DROP POLICY IF EXISTS "faturas_emitidas_storage_update" ON storage.objects;
CREATE POLICY "faturas_emitidas_storage_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'faturas-emitidas'
  AND (
    auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])
    OR auth.uid() = owner
  )
);

-- DELETE: admins ou criador
DROP POLICY IF EXISTS "faturas_emitidas_storage_delete" ON storage.objects;
CREATE POLICY "faturas_emitidas_storage_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'faturas-emitidas'
  AND (
    auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])
    OR auth.uid() = owner
  )
);


-- ----------------------------------------------------------------------------
-- 5. RLS em faturas_emitidas (segue padrão da tabela invoices)
-- ----------------------------------------------------------------------------
ALTER TABLE public.faturas_emitidas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faturas_emitidas_select" ON public.faturas_emitidas;
CREATE POLICY "faturas_emitidas_select"
ON public.faturas_emitidas
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "faturas_emitidas_insert" ON public.faturas_emitidas;
CREATE POLICY "faturas_emitidas_insert"
ON public.faturas_emitidas
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.email() <> 'felipe@colaborador.com'::text
);

DROP POLICY IF EXISTS "faturas_emitidas_update" ON public.faturas_emitidas;
CREATE POLICY "faturas_emitidas_update"
ON public.faturas_emitidas
FOR UPDATE
USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])
  OR (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);

DROP POLICY IF EXISTS "faturas_emitidas_delete" ON public.faturas_emitidas;
CREATE POLICY "faturas_emitidas_delete"
ON public.faturas_emitidas
FOR DELETE
USING (
  auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])
  OR (auth.email() <> 'felipe@colaborador.com'::text AND created_by = auth.uid())
);


-- ----------------------------------------------------------------------------
-- 6. Índices auxiliares
-- ----------------------------------------------------------------------------
-- Index para query rápida da próxima sequência por (serie, ano)
CREATE INDEX IF NOT EXISTS idx_faturas_emitidas_ano_sequencia
  ON public.faturas_emitidas (ano, sequencia);

-- Index para join/lookup por cliente
CREATE INDEX IF NOT EXISTS idx_faturas_emitidas_cliente_id
  ON public.faturas_emitidas (cliente_id);

-- Index para lookup reverso invoices -> faturas_emitidas
CREATE INDEX IF NOT EXISTS idx_invoices_fatura_emitida_id
  ON public.invoices (fatura_emitida_id);


-- ----------------------------------------------------------------------------
-- 7. Comentários (documentação inline)
-- ----------------------------------------------------------------------------
COMMENT ON TABLE  public.faturas_emitidas IS 'Faturas PDF emitidas pelo sistema (registro imutável).';
COMMENT ON COLUMN public.faturas_emitidas.snapshot_cliente IS 'Snapshot imutável dos dados fiscais do cliente no momento da emissão.';
COMMENT ON COLUMN public.faturas_emitidas.linhas IS 'Array de linhas: [{produto_id, descricao, preco, qtd, unidade, desconto, iva, nota_isencao, subtotal}]';
COMMENT ON COLUMN public.faturas_emitidas.totais IS '{subtotal_sem_iva, desconto_comercial, desconto_financeiro, total_sem_iva, total_iva, total_pagar}';
COMMENT ON COLUMN public.faturas_emitidas.resumo_iva IS 'Array de taxas IVA aplicadas: [{taxa, valor}]';
COMMENT ON COLUMN public.faturas_emitidas.pdf_storage_path IS 'Caminho do PDF gerado no bucket faturas-emitidas.';
COMMENT ON COLUMN public.faturas_emitidas.invoice_id IS 'Link para o anexo correspondente em invoices (aba Faturas).';
