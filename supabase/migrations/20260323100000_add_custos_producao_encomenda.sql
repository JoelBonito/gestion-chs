CREATE TABLE IF NOT EXISTS custos_producao_encomenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  encomenda_id uuid NOT NULL REFERENCES encomendas(id) ON DELETE CASCADE,
  item_encomenda_id uuid NOT NULL REFERENCES itens_encomenda(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),
  garrafa numeric DEFAULT 0,
  tampa numeric DEFAULT 0,
  rotulo numeric DEFAULT 0,
  producao_nonato numeric DEFAULT 0,
  frete_sp numeric DEFAULT 0,
  embalagem_carol numeric DEFAULT 0,
  imposto numeric DEFAULT 0,
  diversos numeric DEFAULT 0,
  custo_total_brl numeric DEFAULT 0,
  custo_total_eur numeric DEFAULT 0,
  lucro_joel_real numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(encomenda_id, item_encomenda_id)
);

ALTER TABLE custos_producao_encomenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage custos_producao_encomenda"
  ON custos_producao_encomenda FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
