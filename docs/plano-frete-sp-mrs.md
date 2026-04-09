# Plano: Separar Frete SP-MRS dos Produtos

> **Status:** IMPLEMENTADO (2026-04-08)

## Problema

O frete SP→Marseille (galpão Carol → cliente) é tratado como produto (`00000000-0000-0000-0000-000000000001`), poluindo listagens e rankings de produtos.

## Solucao: Option A — Campos nativos da encomenda

Usar os campos `valor_frete` e `peso_total` que ja existem na tabela `encomendas`. Adicionar campo `custo_frete` para o custo pago a Carol.

### Precos

| | Valor/kg | Uso |
|--|----------|-----|
| **Venda** | 4,95 EUR | Cobrado ao cliente (`valor_frete`) |
| **Custo** | 4,65 EUR | Pago a Carol (`custo_frete` — campo novo) |
| **Margem** | 0,30 EUR | Lucro por kg |

## Etapas

### Etapa 1 — Migration DB
- Adicionar campo `custo_frete NUMERIC DEFAULT 0` na tabela `encomendas`
- **NAO deletar** o produto frete — apenas desativar (`ativo = false`)
- Migrar encomendas em curso: popular `valor_frete` e `custo_frete` a partir dos itens de frete existentes

### Etapa 2 — EncomendaForm: Seccao Frete
- Remover possibilidade de adicionar produto frete como item
- Adicionar seccao "Frete" abaixo dos itens:
  - Toggle para ativar/desativar frete
  - Campos: peso (auto), preco/kg venda (4.95), preco/kg custo (4.65), total venda, total custo
  - Campos editaveis para override manual
  - Auto-recalcula quando peso muda (ja existe logica em `useEffect` linha 227-231)
- Salvar em `encomendas.valor_frete` e `encomendas.custo_frete`

### Etapa 3 — ItensEncomendaManager: Limpar frete
- Remover funcao `isFreteItem()` e tratamento especial do UUID frete
- Frete nao aparece mais como item de encomenda

### Etapa 4 — EncomendaCard / EncomendaView
- Frete exibido como linha separada (nao como item de produto)
- Fonte de dados: `encomendas.valor_frete`

### Etapa 5 — Migracao de dados
- Para encomendas existentes que tem o item produto-frete:
  - Copiar `subtotal` do item frete → `encomendas.valor_frete` (se ainda nao populado)
  - Calcular `custo_frete` = `peso_total * 4.65`
  - Remover os itens de frete (`produto_id = '00000000-...-0001'`) das `itens_encomenda`
- Desativar produto FRETE SAO PAULO - MARSEILLE (`ativo = false`)

## Arquivos Afetados

| # | Arquivo | Mudanca |
|---|---------|---------|
| 1 | `supabase/migrations/` | Nova migration: `custo_frete` + migracao de dados |
| 2 | `src/integrations/supabase/types.ts` | Adicionar `custo_frete` ao tipo `encomendas` |
| 3 | `src/components/encomendas/EncomendaForm.tsx` | Seccao frete com toggle + campos + auto-calculo |
| 4 | `src/components/encomendas/ItensEncomendaManager.tsx` | Remover `isFreteItem()` e tratamento UUID |
| 5 | `src/components/encomendas/EncomendaCard.tsx` | Exibir frete de `encomendas.valor_frete` |
| 6 | `src/pages/Encomendas.tsx` | Garantir `valor_frete` no fetch |
| 7 | `src/lib/config/cost-calculations.ts` | Nenhuma mudanca (frete_sp BRL e outro dominio) |

## Clarificacao: frete_sp vs Frete SP-MRS

| | frete_sp | Frete SP-MRS |
|--|----------|-------------|
| **Rota** | Fabrica Nonato → Galpao Carol | Galpao Carol → Cliente |
| **Moeda** | BRL (R$2/kg) | EUR (4,95 venda / 4,65 custo) |
| **Pago a** | Nonato | Carol |
| **Onde vive** | `custos_producao_encomenda.frete_sp` | `encomendas.valor_frete` + `encomendas.custo_frete` |
| **Escopo** | Apenas encomendas ONL'US | Todas as encomendas |
| **Status** | Mantido como esta | Migrado de produto → campo nativo |
