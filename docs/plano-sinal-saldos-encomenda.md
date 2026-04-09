# Plano: Sinal 50%, Saldo Nonato e Saldo Carol no EncomendaCard

> **Status:** IMPLEMENTADO (2026-04-08)

## Contexto de Custos (referência)

Existem **dois fretes distintos** no sistema:

| Frete | O que é | Moeda | Quem paga | Onde vive |
|-------|---------|-------|-----------|-----------|
| **frete_sp** | Fábrica Nonato → Galpão Carol (BRL) | R$ | Nonato (incluso no custo produção) | `custos_producao_encomenda.frete_sp` |
| **Frete SP-MRS** | Galpão Carol → Cliente final (EUR) | € | Carol | `encomendas.valor_frete` / `encomendas.custo_frete` |

## Objetivo

Na lista de encomendas, para encomendas ONL'US, adicionar 3 campos na linha financeira (após comissão):

| Campo | Cálculo |
|-------|---------|
| **Sinal 50%** | 50% × Σ(garrafa + tampa + producao_nonato) de todos os itens (`custos_producao_encomenda`) |
| **Saldo Nonato** | Σ custos Nonato − Σ pagamentos `destinatario = 'nonato'` |
| **Saldo Carol** | Σ custos Carol − Σ pagamentos `destinatario = 'carol'` |

### Composição dos custos por destinatário

**Custos Nonato** (BRL, via `custos_producao_encomenda`):
- `garrafa` + `tampa` + `producao_nonato`

**Custos Carol** (mix BRL + EUR):
- `embalagem_carol` + `imposto` (BRL, via `custos_producao_encomenda`)
- `custo_frete` do Frete SP-MRS (EUR, via `encomendas.custo_frete` — campo a criar no plano frete)

> **Nota:** `frete_sp` (Nonato→Carol) NÃO entra no saldo Carol. É custo de produção pago ao Nonato.

## Dados Necessários

1. **`custos_producao_encomenda`** — expandir select atual para incluir `garrafa`, `tampa`, `producao_nonato`, `embalagem_carol`, `imposto`
2. **`pagamentos_fornecedor`** — novo batch fetch com `encomenda_id, destinatario, valor_pagamento`
3. **`encomendas.custo_frete`** — campo novo (criado no plano frete) com custo do frete SP-MRS pago à Carol

## Dependência

Este plano depende de `docs/plano-frete-sp-mrs.md` estar implementado, porque:
- O campo `encomendas.custo_frete` (4,65€/kg) precisa existir para calcular o saldo Carol corretamente
- Sem ele, o custo do frete SP-MRS não está separado do valor de venda

## Arquivos Afetados

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/pages/Encomendas.tsx` | Expandir query custos + novo fetch pagamentos + calcular 3 campos + passar ao card |
| 2 | `src/components/encomendas/EncomendaCard.tsx` | Novas props (`sinal50`, `saldoNonato`, `saldoCarol`) + render na linha financeira com separador vertical |

## Passos

### Passo 1 — Data Fetching (`Encomendas.tsx`)
- Expandir select de `custos_producao_encomenda`: `encomenda_id, garrafa, tampa, producao_nonato, embalagem_carol, imposto`
- Novo batch fetch: `pagamentos_fornecedor` filtrado por `orderIds`, campos: `encomenda_id, destinatario, valor_pagamento`
- Ler `encomendas.custo_frete` (já vem no select `*` da encomenda)
- Indexar por `encomenda_id` somando custos e pagamentos por destinatário

### Passo 2 — Cálculos (`Encomendas.tsx`)
No `.map()` do `computed`, para encomendas ONL'US:
- `sinal_50` = 50% × Σ(garrafa + tampa + producao_nonato)
- `saldo_nonato` = Σ(garrafa + tampa + producao_nonato) − pagamentos "nonato"
- `saldo_carol` = Σ(embalagem_carol + imposto) + `custo_frete` − pagamentos "carol"

### Passo 3 — UI (`EncomendaCard.tsx`)
- Props opcionais: `sinal50?: number`, `saldoNonato?: number`, `saldoCarol?: number`
- Renderizar após badge de comissão: separador vertical + 3 campos
- Cores distintas para leitura rápida

## Perguntas em Aberto

1. **Destinatário**: valores exatos no campo `pagamentos_fornecedor.destinatario` — `"nonato"` e `"carol"` (lowercase)?
2. **Saldo negativo**: exibir valor negativo ou badge "Pago"?
3. **Conversão BRL→EUR**: custos Nonato são em BRL — saldo Nonato exibido em BRL ou convertido para EUR?
