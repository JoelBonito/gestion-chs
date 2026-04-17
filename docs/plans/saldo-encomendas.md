# Plano: Aba SALDO no Financeiro

> Status: APROVADO (Socratic Gate respondido em 2026-04-17) — aguardando "aplica" para iniciar T2
> Autor: orchestrator (discovery: explorer + database-architect + frontend-specialist)
> Escopo: uma única aba nova em `/src/pages/Financeiro.tsx`

## Decisões confirmadas pelo usuário

1. **Visibilidade:** EXCLUSIVA para `jbento1@gmail.com`. Esconder para `ham@admin.com`, `felipe@colaborador.com` e qualquer outro.
2. **Moeda:** exibir TODOS os valores numéricos em **EUR + BRL** (dupla coluna ou linha secundária discreta por célula).
3. **Inclusão:** qualquer encomenda com ≥ 1 pendência (a receber OU a pagar) entra, status ≠ cancelada.

## Colunas finais (ordem definitiva)

| # | Coluna | Origem |
|---|--------|--------|
| 1 | Nº Encomenda | `numero_encomenda` |
| 2 | Etiqueta | `etiqueta` (badge) |
| 3 | Cliente | `clientes.nome` |
| 4 | Total a Receber | `saldo_devedor` (EUR + BRL) |
| 5 | Total a Pagar | `saldo_devedor_fornecedor` (EUR + BRL) |
| 6 | Saldo Real | `saldo_devedor - saldo_devedor_fornecedor` (EUR + BRL, colorido) |

---

## 1. Objetivo

Adicionar uma 4ª aba **"Saldo"** no módulo Financeiro que lista, por encomenda em curso com pendências financeiras, o binômio **Valor a Receber × Valor a Pagar × Saldo Líquido**. Serve como painel de situação por encomenda — permite ao usuário entender, em uma linha, se cada encomenda ainda traz dinheiro (saldo positivo), já consumiu caixa (saldo negativo) ou está equilibrada.

Hoje o resumo superior já agrega esses números globalmente (ver `Financeiro.tsx` linhas 19-57) — a aba Saldo é o detalhamento por encomenda dessa mesma conta.

---

## 2. Escopo

### In
- Nova aba `saldo` na `TabsList` de `src/pages/Financeiro.tsx`.
- Novo componente `src/components/financeiro/SaldoEncomendas.tsx`.
- Tabela desktop + cards mobile (padrão do módulo).
- Totalizadores de rodapé.
- Ordenação por saldo absoluto (decrescente) e filtros básicos.
- Export: reutilizar `index.ts` do módulo.

### Out (não faz parte desta entrega)
- Edição/registro de pagamentos (usuário volta às abas Vendas/Compras para isso).
- Aba "Conta Corrente" (ver `project_conta_corrente.md` — escopo separado).
- Rateio de frete SP / impostos por item (escopo futuro da Compras).
- Detalhamento por destinatário (Nonato/Carol) — a aba Saldo fica em nível de encomenda. Breakdown por destinatário já existe em Compras.
- Novas views SQL ou RPCs (usamos as colunas agregadas já existentes).

---

## 3. Arquitetura de Dados

### 3.1 Fonte

**Decisão:** query client-side direta em `encomendas`. Não precisa view/RPC nova — todas as colunas já são materializadas por triggers existentes (evidência: `Financeiro.tsx` linhas 24-43 já consome esses campos para o resumo global).

### 3.2 Colunas usadas (todas em `public.encomendas`)

| Campo | Significado | Unidade |
|-------|-------------|---------|
| `id` | PK | uuid |
| `numero_encomenda` | código visível | text |
| `etiqueta` | tag da encomenda | text \| null |
| `status` | enum `status_encomenda` | text |
| `valor_total` | preço cobrado ao cliente | EUR |
| `valor_pago` | total recebido do cliente (agregado de `pagamentos`) | EUR |
| `saldo_devedor` | = `valor_total - valor_pago` (materializado) | EUR |
| `valor_total_custo` | custo real agregado do fornecedor | EUR |
| `valor_pago_fornecedor` | total já pago ao fornecedor (agregado de `pagamentos_fornecedor`) | EUR |
| `saldo_devedor_fornecedor` | = `valor_total_custo - valor_pago_fornecedor` (materializado) | EUR |
| `data_producao_estimada` | data ref. ordenação secundária | date |
| `cliente_id` (via join `clientes!inner(nome)`) | nome do cliente | text |

> Todos os custos de fornecedor já são convertidos para EUR pelo pipeline de `custos_producao_encomenda` (ver `ContasPagar.tsx` linhas 168-171). Portanto a aba Saldo trabalha inteiramente em EUR e exibe BRL apenas como hint opcional (ver §4.5).

### 3.3 Fórmulas (exibidas na UI)

```
valor_a_receber = saldo_devedor              -- já materializado
valor_a_pagar   = saldo_devedor_fornecedor   -- já materializado
saldo_liquido   = valor_a_receber - valor_a_pagar
```

**Interpretação do saldo líquido:**
- `saldo > 0` → falta entrar mais caixa do que sair (encomenda "saudável" financeiramente) → cor verde.
- `saldo < 0` → falta pagar mais do que receber (alerta de caixa) → cor vermelha.
- `saldo ≈ 0` (±0.01 €) → encomenda em equilíbrio → cor neutra.

### 3.4 Filtro "em curso com pendências"

```sql
WHERE COALESCE(saldo_devedor, 0) > 0.01
   OR COALESCE(saldo_devedor_fornecedor, 0) > 0.01
```

> Nota: o enum `status_encomenda` só admite `NOVO PEDIDO | MATÉRIA PRIMA | PRODUÇÃO | EMBALAGENS | TRANSPORTE | ENTREGUE`. Não existe estado "cancelada" — portanto não há o que excluir por status. O filtro de saldo > 0.01 já garante que encomendas quitadas (entregues e pagas) não aparecem.

No Supabase client:

```
supabase
  .from("encomendas")
  .select(`
    id, numero_encomenda, etiqueta, status,
    valor_total, valor_pago, saldo_devedor,
    valor_total_custo, valor_pago_fornecedor, saldo_devedor_fornecedor,
    data_producao_estimada,
    clientes!inner(nome)
  `)
  .neq("status", "cancelada")
  .or("saldo_devedor.gt.0.01,saldo_devedor_fornecedor.gt.0.01")
  .order("data_criacao", { ascending: false });
```

> Fallback se `.or()` com vírgula causar parse issue no PostgREST: fazer duas queries e unir client-side (menos eficiente, mas trivial). Decisão: tentar `.or()` primeiro.

### 3.5 Shape do row (TypeScript)

```ts
interface SaldoEncomendaRow {
  id: string;
  numero_encomenda: string;
  etiqueta: string | null;
  cliente_nome: string;
  status: string;
  valor_a_receber: number;   // EUR
  valor_a_pagar: number;     // EUR
  saldo_liquido: number;     // EUR
}
```

---

## 4. Arquitetura de UI

### 4.1 Arquivos a criar

- `src/components/financeiro/SaldoEncomendas.tsx` — componente principal (tabela + cards mobile).

### 4.2 Arquivos a modificar

| Arquivo | Linhas aprox. | Mudança |
|---------|---------------|---------|
| `src/components/financeiro/index.ts` | fim do arquivo | `export { default as SaldoEncomendas } from './SaldoEncomendas';` |
| `src/pages/Financeiro.tsx` | L5 | adicionar import `SaldoEncomendas` |
| `src/pages/Financeiro.tsx` | L10 | trocar `type TabKey = "encomendas" \| "pagar" \| "faturas"` → adicionar `\| "saldo"` |
| `src/pages/Financeiro.tsx` | L145-170 (TabsList) | adicionar `<TabsTrigger value="saldo">Saldo</TabsTrigger>` (visível para todos por padrão) |
| `src/pages/Financeiro.tsx` | L172-188 (TabsContent) | adicionar `<TabsContent value="saldo"><SaldoEncomendas /></TabsContent>` |
| `src/hooks/useFinanceiroTranslation.ts` | dicionário interno | adicionar chave `Saldo: { pt: "Saldo", fr: "Solde" }` e demais labels |

### 4.3 Visibilidade por usuário (CONFIRMADO)

Aba **exclusiva** para `jbento1@gmail.com`. Implementação:
```tsx
const isJoel = user?.email === "jbento1@gmail.com";
// render TabsTrigger e TabsContent de "saldo" só se isJoel === true
```
Esconder para `ham@admin.com`, `felipe@colaborador.com` e qualquer outro email. Não depende dos flags `isHam`/`isFelipe` — é um check explícito de email.

### 4.4 Layout desktop (≥ `xl`)

```
Card "Saldo por Encomenda"
├── Header: título + filtros (Switch "Ocultar zerados" + input de busca livre)
└── Table
    ├── TableHead
    │   Nº | Etiqueta | Cliente | Total a Receber | Total a Pagar | Saldo Real
    ├── TableBody
    │   Ex:
    │   #1234 | [urgente] | João Silva | 500,00 €    | 200,00 €    | +300,00 € (verde)
    │                                   R$ 2.850,00    R$ 1.140,00    R$ 1.710,00
    └── TableFooter (sticky)
        Totais: — | — | — | Σ a_receber (EUR/BRL) | Σ a_pagar (EUR/BRL) | Σ saldo (EUR/BRL)
```

Em cada célula monetária: EUR em negrito no topo, BRL em `text-xs text-muted-foreground` abaixo.

### 4.5 Layout mobile (`< xl`)

Mesmo padrão de cards usado em `EncomendasFinanceiro.tsx` (L304-402):
- Header do card: `#numero` + badge + data.
- Grid 3 colunas: A Receber / A Pagar / Saldo.
- Footer do card com cor no Saldo.

### 4.6 Cores e formatação (dupla moeda EUR + BRL)

- Usar helpers existentes em `src/lib/utils/currency.ts`: `formatCurrencyEUR` e `formatCurrencyBRL` (taxa EUR→BRL já usada no dashboard e em Nonato — reutilizar, não reinventar).
- Cada célula numérica renderiza 2 linhas: EUR (principal) + BRL (secundário, `text-xs text-muted-foreground`).
- Saldo positivo: EUR em `text-success` (verde).
- Saldo negativo: EUR em `text-destructive` (vermelho).
- Saldo ~zero (abs < 0.01): `text-muted-foreground`.
- A Receber e A Pagar: EUR em `text-warning` (padrão das outras abas); BRL mantém `text-muted-foreground`.

### 4.7 Ordenação e filtros

- Ordenação padrão: `|saldo_liquido| DESC` (encomendas mais "impactantes" no topo).
- Sort toggleable por coluna (cliente, a_receber, a_pagar, saldo).
- Filtro texto: busca em `numero_encomenda` + `cliente_nome` (client-side).
- Switch "Ocultar zerados" (default OFF pois a query já filtra > 0.01).

### 4.8 Princípios React (best practices)

- Componente como function component + hooks (padrão do projeto).
- `useState` para dados; `useCallback` para fetch; `useMemo` para ordenação/filtro derivados.
- Keys estáveis (`encomenda.id`).
- Sem efeitos colaterais em render.
- Evitar re-fetch: um único `useEffect([])` no mount + botão manual de refresh.

---

## 5. Tarefas Sequenciais

- [ ] **T1** — Confirmar fórmula do saldo e respostas do Socratic Gate (§7) com o usuário. → Verify: usuário responde as 3 perguntas.
- [ ] **T2** — Criar `src/components/financeiro/SaldoEncomendas.tsx` com fetch + tabela desktop. → Verify: tabela renderiza em `/financeiro?tab=saldo`.
- [ ] **T3** — Adicionar layout mobile (cards) no mesmo componente. → Verify: viewport < `xl` mostra cards.
- [ ] **T4** — Adicionar totalizadores no `TableFooter` e no bloco inferior dos cards mobile. → Verify: soma das 3 colunas bate com o resumo global de `Financeiro.tsx` topo.
- [ ] **T5** — Adicionar filtro por texto e sort por coluna. → Verify: digitar nome de cliente filtra; clicar header alterna ordenação.
- [ ] **T6** — Registrar export em `src/components/financeiro/index.ts`. → Verify: `import { SaldoEncomendas } from "@/components/financeiro"` compila.
- [ ] **T7** — Atualizar `src/pages/Financeiro.tsx`: `TabKey`, `TabsTrigger`, `TabsContent`, regra de visibilidade. → Verify: aba aparece na UI.
- [ ] **T8** — Atualizar `useFinanceiroTranslation.ts` com rótulos PT/FR da nova aba. → Verify: troca para locale FR não quebra labels.
- [ ] **T9** — Rodar `npm run lint && npx tsc --noEmit`. → Verify: sem erros.
- [ ] **T10** — Teste manual: encomenda com só saldo a receber, encomenda com só a pagar, encomenda com ambos, encomenda zerada (não deve aparecer). → Verify: comportamento correto em cada caso.

---

## 6. Riscos & Edge Cases

| Risco | Mitigação |
|-------|-----------|
| `saldo_devedor` / `saldo_devedor_fornecedor` desatualizado se triggers falharem | Fallback no SELECT: `valor_total - valor_pago` e `valor_total_custo - valor_pago_fornecedor` calculados client-side se as colunas vierem null. |
| Encomenda cancelada com saldo residual aparecendo na lista | Filtro `status <> 'cancelada'` obrigatório. Confirmar que `'cancelada'` é o valor correto do enum (ver `types.ts` `status_encomenda`). |
| Encomendas com `valor_total_custo = null` (compra ainda não precificada) | Tratar como `0` → entra só se `saldo_devedor > 0`. Documentar no tooltip. |
| Conversão BRL residual em `valor_total_custo` | Já resolvido pelo pipeline atual (ver `ContasPagar.tsx`). A aba trabalha 100% em EUR. Não re-converter. |
| `.or()` do PostgREST falhar em parse | Fallback: duas queries `.gt("saldo_devedor", 0.01)` + `.gt("saldo_devedor_fornecedor", 0.01)` e merge client-side por id. |
| Volume de dados (muitas encomendas) | Para v1, sem paginação (expectativa < 500 linhas). Adicionar `limit(500)` defensivo e aviso se atingir. |
| Performance: join `clientes!inner(nome)` | Já é padrão no projeto (`EncomendasFinanceiro.tsx` L84). OK. |
| Saldo negativo para o usuário confundir | Legend/tooltip no header da coluna Saldo explicando: "Positivo = ainda falta receber mais do que pagar". |

---

## 7. Critérios de Aceite

1. Aba "Saldo" visível em `/financeiro` para os usuários autorizados, entre "Compras" e "Faturas" (ou outra posição definida no Socratic Gate).
2. Listagem mostra **somente encomendas com ≥ 1 pendência** (receber OU pagar) e status ≠ cancelada.
3. Cada linha exibe: número, cliente, status, a receber, a pagar, saldo líquido, tudo em EUR formatado.
4. Saldo líquido com cor: verde (positivo), vermelho (negativo), cinza (≈ zero).
5. Totalizadores no rodapé somam exatamente os valores dos cards globais do topo da página `Financeiro.tsx` (diferença ≤ 0.01 €).
6. Ordenação padrão por `|saldo|` decrescente.
7. Responsivo: tabela no desktop, cards no mobile/tablet.
8. `npm run lint` e `npx tsc --noEmit` passam sem erros/avisos novos.
9. Sem novos endpoints, migrations ou RPCs (apenas leitura no schema atual).

---

## 8. Estimativa de Esforço

| Fase | Tempo |
|------|-------|
| Setup componente + fetch + tabela desktop | 45 min |
| Cards mobile | 20 min |
| Totalizadores + sort + filtro texto | 30 min |
| Integração no `Financeiro.tsx` + traduções | 15 min |
| Lint/TS + teste manual cross-cases | 20 min |
| **Total** | **~2h – 2h30** |

---

## 9. Socratic Gate — RESPONDIDO (2026-04-17)

1. **Visibilidade:** ✅ Exclusiva para `jbento1@gmail.com`.
2. **Moeda:** ✅ Todos os campos em EUR + BRL (dupla linha por célula, helpers existentes).
3. **Encomendas com 1 pendência:** ✅ Entram (receber OU pagar). Colunas finais: Nº, Etiqueta, Cliente, Total a Receber, Total a Pagar, Saldo Real.

> Aguardando "aplica" / "vai" do usuário para iniciar T2 (criação do componente).
