# Plan: Production Cost Tracking per Order (Custos de Producao por Encomenda)

## Goal

Change commission calculation from `qty * preco_venda - qty * preco_custo` to use `lucro_joel` from products. Add a per-product cost form inside the order edit modal so that, when filled, commission recalculates using real production costs (`lucro_joel_real`). Dashboard must reflect the same logic.

---

## Exclusion Rules

- Orders `ENC017`, `ENC013`, `ENC012` keep existing commission logic (hardcoded skip)
- All orders with status `ENTREGUE` keep existing commission logic
- Only NEW and IN-PROGRESS orders use the new logic

---

## Task 1: Database Migration

**File:** `supabase/migrations/20260323100000_add_custos_producao_encomenda.sql`

Create table `custos_producao_encomenda` to store per-product real costs within an order:

```sql
CREATE TABLE IF NOT EXISTS custos_producao_encomenda (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  encomenda_id uuid NOT NULL REFERENCES encomendas(id) ON DELETE CASCADE,
  item_encomenda_id uuid NOT NULL REFERENCES itens_encomenda(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),

  -- Cost breakdown fields (all in BRL)
  garrafa numeric DEFAULT 0,        -- was "embalagem" in CustoBreakdown
  tampa numeric DEFAULT 0,
  rotulo numeric DEFAULT 0,
  producao_nonato numeric DEFAULT 0,
  frete_sp numeric DEFAULT 0,
  embalagem_carol numeric DEFAULT 0, -- was "manuseio_carol" in CustoBreakdown
  imposto numeric DEFAULT 0,
  diversos numeric DEFAULT 0,        -- NEW field

  -- Computed totals (stored for query performance)
  custo_total_brl numeric DEFAULT 0,   -- sum of all cost fields
  custo_total_eur numeric DEFAULT 0,   -- custo_total_brl / exchange_rate
  lucro_joel_real numeric DEFAULT 0,   -- preco_venda - custo_total_eur (per unit)

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(encomenda_id, item_encomenda_id)
);

-- Enable RLS
ALTER TABLE custos_producao_encomenda ENABLE ROW LEVEL SECURITY;

-- RLS policy: same as encomendas (authenticated users)
CREATE POLICY "Authenticated users can manage custos_producao_encomenda"
  ON custos_producao_encomenda FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);
```

**File:** `supabase/migrations/20260323110000_add_exchange_rate_config.sql`

Create a simple config table for exchange rate:

```sql
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_config"
  ON app_config FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can update app_config"
  ON app_config FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Insert default exchange rate
INSERT INTO app_config (key, value)
VALUES ('brl_eur_rate', '{"rate": 6}')
ON CONFLICT (key) DO NOTHING;
```

**Verify:** Run migrations via Supabase CLI or dashboard. Confirm tables exist.

---

## Task 2: Update TypeScript Types

**File:** `src/types/database.ts`

Add new interfaces:

```typescript
export interface CustoProducaoEncomenda {
  id?: string;
  encomenda_id: string;
  item_encomenda_id: string;
  produto_id: string;
  garrafa: number;
  tampa: number;
  rotulo: number;
  producao_nonato: number;
  frete_sp: number;
  embalagem_carol: number;
  imposto: number;
  diversos: number;
  custo_total_brl: number;
  custo_total_eur: number;
  lucro_joel_real: number;
  created_at?: string;
  updated_at?: string;
}
```

**File:** `src/integrations/supabase/types.ts`

Add the `custos_producao_encomenda` and `app_config` table types to the Database interface (after migration sync).

**Verify:** `npx tsc --noEmit` passes.

---

## Task 3: Exchange Rate Utility Update

**File:** `src/lib/utils/currency.ts`

Changes:
1. Keep `BRL_EUR_RATE = 6` as default/fallback
2. Add a mutable `currentRate` that can be updated at runtime
3. Add `fetchExchangeRate()` to load from `app_config` table
4. Add `updateExchangeRate(rate: number)` to save to `app_config`
5. Update `brlToEur()` and `eurToBrl()` to use `currentRate`

```typescript
let currentRate = BRL_EUR_RATE; // mutable runtime rate

export function setExchangeRate(rate: number) {
  currentRate = rate;
}

export function getExchangeRate(): number {
  return currentRate;
}

export async function fetchExchangeRate(): Promise<number> {
  const { data } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "brl_eur_rate")
    .single();
  if (data?.value?.rate) {
    currentRate = data.value.rate;
  }
  return currentRate;
}

export async function updateExchangeRate(rate: number): Promise<void> {
  await supabase
    .from("app_config")
    .upsert({ key: "brl_eur_rate", value: { rate }, updated_at: new Date().toISOString() });
  currentRate = rate;
}
```

Update `brlToEur` and `eurToBrl` to use `getExchangeRate()` instead of hardcoded `BRL_EUR_RATE`.

**File:** `src/lib/config/cost-calculations.ts`

Update `calcularImposto` to use `getExchangeRate()` instead of `BRL_EUR_RATE`.

**Verify:** All existing BRL/EUR conversions still work. `npx tsc --noEmit` passes.

---

## Task 4: Commission Calculation Utility

**New file:** `src/lib/utils/commission.ts`

Create a shared commission calculation function used by both Encomendas page and Dashboard:

```typescript
import { FORNECEDOR_PRODUCAO_ID } from "@/lib/permissions";

// Orders excluded from new logic
const EXCLUDED_ORDERS = new Set(["ENC017", "ENC013", "ENC012"]);

interface CommissionItem {
  quantidade: number;
  preco_unitario: number;  // preco_venda in EUR
  preco_custo: number;     // preco_custo in EUR
  lucro_joel?: number | null;       // from product
  lucro_joel_real?: number | null;  // from custos_producao_encomenda (if filled)
  fornecedor_id?: string;
}

interface CommissionContext {
  numero_encomenda: string;
  status: string;
  fornecedor_id?: string;
}

export function calcularComissaoItem(
  item: CommissionItem,
  context: CommissionContext
): number {
  const qty = item.quantidade || 0;

  // Excluded orders: keep old logic
  if (EXCLUDED_ORDERS.has(context.numero_encomenda) || context.status === "ENTREGUE") {
    return qty * item.preco_unitario - qty * item.preco_custo;
  }

  const isOnlus = (item.fornecedor_id || context.fornecedor_id) === FORNECEDOR_PRODUCAO_ID;

  if (!isOnlus) {
    // Non-ONL'US products: keep old logic (preco_venda - preco_custo)
    return qty * item.preco_unitario - qty * item.preco_custo;
  }

  // ONL'US products:
  // If real cost form was filled, use lucro_joel_real
  if (item.lucro_joel_real != null && item.lucro_joel_real > 0) {
    return qty * item.lucro_joel_real;
  }

  // Default: use lucro_joel from product
  if (item.lucro_joel != null && item.lucro_joel > 0) {
    return qty * item.lucro_joel;
  }

  // Fallback: old formula
  return qty * item.preco_unitario - qty * item.preco_custo;
}
```

**Why this matters:** Single source of truth for commission. Both `Encomendas.tsx` and `Dashboard.tsx` call this same function.

**Verify:** Unit-testable pure function. Can verify with manual calculation.

---

## Task 5: Move FORNECEDOR_PRODUCAO_ID to permissions.ts

**File:** `src/lib/permissions.ts`

Add export (it's already in `ROSA_ALLOWED_SUPPLIERS` but not as a named constant):

```typescript
export const FORNECEDOR_PRODUCAO_ID = "b8f995d2-47dc-4c8f-9779-ce21431f5244";
```

Then update all files that hardcode this ID to import from `permissions.ts`:
- `src/pages/Produtos.tsx` (line 28)
- `src/components/produtos/ProdutoView.tsx` (line 262)
- `src/components/produtos/ProdutoForm.tsx` (line 129)

**Verify:** `grep -r "b8f995d2-47dc-4c8f-9779-ce21431f5244" src/` shows only `permissions.ts` and `ROSA_ALLOWED_SUPPLIERS`.

---

## Task 6: Update Commission in Encomendas.tsx

**File:** `src/pages/Encomendas.tsx`

Changes to `fetchEncomendas` (lines 134-195):

1. Expand the `itens_encomenda` select to also fetch `lucro_joel` and `fornecedor_id` from the product:
   ```
   itens_encomenda(
     id,
     quantidade,
     preco_unitario,
     preco_custo,
     produtos(nome, size_weight, lucro_joel, fornecedor_id)
   )
   ```

2. Also fetch real costs from `custos_producao_encomenda` for each order (joined or separate query).

3. Replace the commission calculation loop (lines 162-171) to use `calcularComissaoItem()` from Task 4.

4. Pass `fornecedor_id` from the order to the commission context.

5. Update the `EncomendaDBRow` interface to include `lucro_joel` and `fornecedor_id` in the product join.

**Implementation approach:**

Option A (recommended): After fetching orders, batch-fetch all `custos_producao_encomenda` for the loaded order IDs in a single query. Then join them in-memory by `item_encomenda_id`.

Option B: Add `custos_producao_encomenda` to the Supabase select join. This may be complex with nested joins.

**Verify:** Commission values in the order list update correctly. Excluded orders (ENC017, ENC013, ENC012) and ENTREGUE orders show old values.

---

## Task 7: Update Commission in Dashboard.tsx

**File:** `src/pages/Dashboard.tsx`

Changes to three queries: `comissoes-mensais`, `comissoes-anuais`, `comissoes-por-mes`.

All three currently calculate `lucro = qty * preco_unitario - qty * preco_custo`.

Update all three to:

1. Also select `produtos(lucro_joel, fornecedor_id)` in the join
2. Also select `encomendas!inner(data_producao_estimada, numero_encomenda, status, fornecedor_id)`
3. Fetch `custos_producao_encomenda` for the relevant items (batch query)
4. Use `calcularComissaoItem()` for each item

**Note:** The dashboard queries filter by `data_producao_estimada` date range. The exclusion logic needs the `numero_encomenda` and `status` from the joined `encomendas`, which is already in the join (`encomendas!inner`). Just expand the select.

**Performance consideration:** The `custos_producao_encomenda` fetch can be done as a second query after getting the item IDs. Cache with react-query.

**Verify:** Dashboard "Comissoes (Mes)" and "Comissoes (Ano)" cards show updated values. Monthly performance grid shows correct values.

---

## Task 8: Cost Form Component for Orders

**New file:** `src/components/encomendas/CustoProducaoForm.tsx`

A Sheet (slide-out panel) component showing the cost breakdown form for a specific product within an order.

**Fields (all in BRL):**
- `garrafa` (Garrafa) - was "embalagem"
- `tampa` (Tampa)
- `rotulo` (Rotulo)
- `producao_nonato` (Producao)
- `frete_sp` (Frete SP) - auto-calculated from product weight
- `embalagem_carol` (Embalagem Carol) - was "manuseio_carol"
- `imposto` (Imposto) - auto-calculated from product weight
- `diversos` (Diversos) - NEW, manual

**Auto-calculations:** Use existing `calcularCustosAutomaticos()` from `src/lib/config/cost-calculations.ts` for `frete_sp` and `imposto`. Update `manuseio_carol` reference to `embalagem_carol` in the auto-calc (or keep same formula, just rename the field).

**Behavior:**
- Shows total cost in BRL and EUR
- Calculates `lucro_joel_real = preco_venda - custo_total_eur` per unit
- On save: upsert to `custos_producao_encomenda` table
- Shows "pre-fill from product defaults" option (copy from product's `custo_tabela_breakdown`)

**Props:**
```typescript
interface CustoProducaoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encomendaId: string;
  itemEncomendaId: string;
  produtoId: string;
  produtoNome: string;
  precoVenda: number;    // EUR per unit
  sizeWeight?: number;   // grams, for auto-calc
  existingCusto?: CustoProducaoEncomenda | null;
  onSaved: () => void;
}
```

**Reuse:** Can reuse UI patterns from existing `CustoBreakdownForm.tsx` (field layout, BRL/EUR display, auto-calc badges). Do NOT modify the existing `CustoBreakdownForm.tsx` - create a new component.

**Verify:** Form opens, fields work, saves to DB, auto-calc works.

---

## Task 9: Add Cost Button to EncomendaForm

**File:** `src/components/encomendas/EncomendaForm.tsx`

When `isEditing === true` and the order is NOT excluded (not ENC017/013/012, not ENTREGUE):

1. After the `ItensEncomendaManager` section, add a new section: "Custos de Producao"
2. For each item that belongs to ONL'US (check `fornecedor_id === FORNECEDOR_PRODUCAO_ID`), show a row with:
   - Product name
   - Status badge: "Pendente" (no cost filled) or "Preenchido" (cost exists)
   - Button: "Preencher Custos" / "Editar Custos"
3. Clicking the button opens `CustoProducaoForm` (from Task 8)
4. Only show this section for ONL'US orders (where `fornecedor_id === FORNECEDOR_PRODUCAO_ID`)

**Data flow:**
- On form mount (editing mode), fetch existing `custos_producao_encomenda` for this order
- Pass existing data to `CustoProducaoForm` for pre-fill
- On save callback, refresh the costs data

**File:** `src/components/encomendas/ItensEncomendaManager.tsx`

No changes needed. The cost button is NOT per-item-row but in a separate section below the items table.

**Verify:** Open edit modal for an ONL'US order. See "Custos de Producao" section. Click button. Fill form. Save. Reopen - see "Preenchido" status.

---

## Task 10: Update EncomendaView.tsx Commission Display

**File:** `src/components/encomendas/EncomendaView.tsx`

The "Lucro estimado" (line 223) currently uses `subtotalVenda - subtotalCusto`.

Update to:
1. Fetch `custos_producao_encomenda` for this order
2. Fetch `lucro_joel` from products
3. Use `calcularComissaoItem()` per item
4. Sum for total commission/profit display

Apply same exclusion rules (ENC017/013/012, ENTREGUE orders keep old calc).

**Verify:** View modal shows updated profit. Excluded orders show old values.

---

## Task 11: Exchange Rate Settings UI

**File:** `src/pages/Dashboard.tsx` or a new settings component

Add a small "Exchange Rate" display/edit widget. Options:

Option A (simple): Add to Dashboard as a small card showing current rate with edit button (admin only).

Option B (better): Add to existing settings page if one exists.

Implementation:
- Show current rate (e.g., "1 EUR = 6.00 BRL")
- Edit button opens inline input
- Save calls `updateExchangeRate()` from `currency.ts`
- On app load, call `fetchExchangeRate()` once (in App.tsx or a provider)

**File:** `src/App.tsx`

Add a `useEffect` on mount to call `fetchExchangeRate()` so the rate is loaded before any calculations.

**Verify:** Change rate. Verify all BRL/EUR conversions update. Reset to 6.

---

## Task 12: Verification

- [ ] Create a test order with ONL'US products. Commission shows `qty * lucro_joel`.
- [ ] Fill cost form for one product. Commission updates to use `lucro_joel_real` for that product.
- [ ] Leave second product unfilled. Commission uses `lucro_joel` (default) for it.
- [ ] Check Dashboard - monthly/annual commissions reflect new logic.
- [ ] Verify ENC017, ENC013, ENC012 still show old commission values.
- [ ] Verify ENTREGUE orders still show old commission values.
- [ ] Verify non-ONL'US orders use old `preco_venda - preco_custo` formula.
- [ ] Change exchange rate. Verify cost form EUR conversions update.
- [ ] Run `npx tsc --noEmit` - no TypeScript errors.
- [ ] Run `npm run lint` - no lint errors.

---

## Implementation Order

1. **Task 1** - Database migrations (foundation)
2. **Task 2** - TypeScript types (needed by everything)
3. **Task 5** - Centralize FORNECEDOR_PRODUCAO_ID (small refactor, reduces duplication)
4. **Task 3** - Exchange rate utility (needed by cost form)
5. **Task 4** - Commission utility function (needed by pages)
6. **Task 8** - Cost form component (UI, independent)
7. **Task 6** - Update Encomendas.tsx commission (uses Task 4)
8. **Task 9** - Add cost button to EncomendaForm (uses Task 8)
9. **Task 10** - Update EncomendaView commission display
10. **Task 7** - Update Dashboard commission (uses Task 4)
11. **Task 11** - Exchange rate settings UI
12. **Task 12** - End-to-end verification

---

## Files Summary

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/20260323100000_add_custos_producao_encomenda.sql` |
| CREATE | `supabase/migrations/20260323110000_add_exchange_rate_config.sql` |
| CREATE | `src/lib/utils/commission.ts` |
| CREATE | `src/components/encomendas/CustoProducaoForm.tsx` |
| MODIFY | `src/types/database.ts` |
| MODIFY | `src/integrations/supabase/types.ts` |
| MODIFY | `src/lib/utils/currency.ts` |
| MODIFY | `src/lib/config/cost-calculations.ts` |
| MODIFY | `src/lib/permissions.ts` |
| MODIFY | `src/pages/Encomendas.tsx` |
| MODIFY | `src/pages/Dashboard.tsx` |
| MODIFY | `src/components/encomendas/EncomendaForm.tsx` |
| MODIFY | `src/components/encomendas/EncomendaView.tsx` |
| MODIFY | `src/pages/Produtos.tsx` (import refactor only) |
| MODIFY | `src/components/produtos/ProdutoView.tsx` (import refactor only) |
| MODIFY | `src/components/produtos/ProdutoForm.tsx` (import refactor only) |
| MODIFY | `src/App.tsx` (exchange rate fetch on mount) |
