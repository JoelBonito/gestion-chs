# Plano: Fornecedores por Item de Produção + Pagamento Granular (Onl'us)

## Goal
Permitir associar fornecedores a cada item de custo da gestão de produção (persistido por produto), e pagar individualmente cada item em Financeiro > Compras com controle de moeda (BRL/EUR) e fornecedor editável no destino.

---

## Tasks

### Phase 1: Database & Schema

- [ ] **Task 1: Criar migration SQL** → Verify: `supabase db diff` não mostra drift; campos novos existem
  - Adicionar `fornecedor_breakdown jsonb` em `produtos` (estrutura: `{ garrafa_id, tampa_id, rotulo_id, producao_id, frete_sp_id, embalagem_id, imposto_id, diversos_id }`)
  - Adicionar `fornecedor_breakdown jsonb` em `custos_producao_encomenda` (snapshot do fornecedor usado naquela encomenda)
  - Adicionar `fornecedor_id uuid → fornecedores.id` em `pagamentos_fornecedor` (quem recebeu o pagamento efetivo)
  - Adicionar `moeda text DEFAULT 'EUR'` em `pagamentos_fornecedor` (BRL ou EUR)
  - Adicionar `item_tipo text` em `pagamentos_fornecedor` (garrafa, tampa, rotulo, producao, frete_sp, embalagem, imposto, diversos, frete_internacional)

### Phase 2: Types & Backend

- [ ] **Task 2: Atualizar tipos TypeScript** → Verify: `npx tsc --noEmit` passa sem erro
  - Atualizar `src/types/database.ts`: `CustoBreakdown` + fornecedor_ids; `PagamentoFornecedor` com novos campos
  - Atualizar `src/integrations/supabase/types.ts` (regenerate ou manual)

### Phase 3: Gestão de Produção (Origem)

- [ ] **Task 3: Modificar `CustoProducaoForm.tsx`** → Verify: Abrir gestão de produção mostra selects de fornecedor ao lado de cada campo de custo
  - Adicionar prop `fornecedorBreakdownDefault?: FornecedorBreakdown | null`
  - Adicionar estado local para fornecedor por campo (8 selects)
  - Integrar select de fornecedores com busca em `fornecedores` table + botão "+ Novo" rápido
  - Incluir `fornecedor_breakdown` no payload do `upsert` para `custos_producao_encomenda`
  - Após salvar custos, fazer `UPDATE produtos SET fornecedor_breakdown = ... WHERE id = produtoId`

- [ ] **Task 4: Modificar `GestaoProducaoSheet.tsx`** → Verify: Nova encomenda do mesmo produto carrega fornecedores previamente salvos
  - Buscar `fornecedor_breakdown` junto com `custo_nonato_breakdown` na query de produtos
  - Passar `fornecedorBreakdownDefault` para cada `CustoProducaoForm`

### Phase 4: Financeiro > Compras (Destino)

- [ ] **Task 5: Refatorar `ContasPagar.tsx`** → Verify: Expandir encomenda Onl'us mostra cards individuais por item (garrafa, tampa, rotulo, producao, frete_sp, embalagem, imposto, diversos, frete_internacional) com fornecedor sugerido, previsto, pago, saldo
  - Substituir blocos "Nonato/Carol" por lista plana de itens pagáveis
  - Cada item card: label | fornecedor sugerido (editável ao pagar) | previsto (BRL ou EUR) | pago | saldo | botão "Pagar"
  - Frete internacional: ler `custo_frete` da encomenda, moeda EUR
  - Regras de fornecedor default:
    - producao → Nonato (fixo)
    - embalagem, imposto → Carol (fixo)
    - demais → do `fornecedor_breakdown` ou "Escolher"
  - Agrupar saldo geral ainda por fornecedor para visão consolidada (opcional, abaixo dos cards)

- [ ] **Task 6: Modificar `PagamentoFornecedorForm.tsx`** → Verify: Formulário de pagamento mostra o item escolhido, permite trocar fornecedor, define valor em BRL ou EUR conforme item
  - Nova prop: `itemTipo`, `fornecedorSugeridoId`, `moedaEsperada`
  - Select de fornecedor (busca lista + criar novo inline) — pré-selecionado com sugestão
  - Campo valor com prefixo dinâmico: R$ para BRL, € para EUR
  - Ao salvar: registra `item_tipo`, `fornecedor_id`, `moeda`, `destinatario` (derivado do item), `categoria` (derivada do item)
  - Atualizar trigger de email para incluir item + fornecedor

### Phase 5: Consolidação & Visão

- [ ] **Task 7: Atualizar `PaymentDetailsModal.tsx`** → Verify: Modal de histórico mostra item + fornecedor + moeda de cada pagamento
  - Adicionar colunas: Item, Fornecedor, Moeda
  - Agrupar opcionalmente por fornecedor

- [ ] **Task 8: Atualizar `ProdutoForm.tsx`** → Verify: Aba de custos do produto mostra fornecedores associados em modo readonly
  - Exibir `fornecedor_breakdown` na tela de edição do produto (referência/visualização)

### Phase 6: Validação

- [ ] **Task 9: Testar fluxo completo E2E** → Verify: Criar encomenda Onl'us → gestão de produção (define custos + fornecedores) → Financeiro > Compras → pagar 3 itens diferentes → verificar histórico
  - Criar encomenda Onl'us
  - Preencher gestão de produção com fornecedores
  - Ir em Financeiro > Compras, expandir
  - Pagar garrafa (BRL, fornecedor X), embalagem (BRL, Carol), frete int (EUR, fornecedor Y)
  - Verificar `pagamentos_fornecedor` tem `fornecedor_id`, `item_tipo`, `moeda` corretos
  - Criar nova encomenda do mesmo produto → verificar fornecedores pré-carregados

- [ ] **Task 10: Rodar lint/type-check** → Verify: `npm run lint` e `npm run build` passam

---

## Done When
- [ ] Gestão de produção salva fornecedor por item e persiste no produto
- [ ] Nova encomenda do mesmo produto carrega fornecedores previamente definidos
- [ ] Financeiro > Compras mostra itens individuais com fornecedor sugerido + saldo
- [ ] Pagamento registra fornecedor efetivo, tipo de item e moeda (BRL/EUR)
- [ ] Histórico de pagamentos mostra item + fornecedor + moeda
- [ ] Build e lint passam sem erro

---

## Notes
- **Moedas:** Todos os itens de produção (garrafa, tampa, rotulo, producao, frete_sp, embalagem, imposto, diversos) são pagos em **BRL**. Apenas **frete internacional** (`custo_frete` da encomenda) é pago em **EUR**.
- **Fornecedores fixos:** `producao` → Nonato; `embalagem`, `imposto` → Carol. Esses não precisam de select na origem, mas devem ser exibidos como readonly.
- **Tabela de fornecedores:** Usar `fornecedores` existente. Para "criar na hora", usar modal inline ou redirecionar para `FornecedorForm`.
- **JSONB estrutura:** `fornecedor_breakdown` segue mesmo padrão de `custo_nonato_breakdown` (map campo → uuid).
