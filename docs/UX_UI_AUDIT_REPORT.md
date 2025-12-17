# 📊 Relatório de Auditoria UX/UI - Gestion CHS
📅 **Data**: 15 de Dezembro de 2025

| Status Geral | Conformidade Estimada | Ação Recomendada |
| :--- | :--- | :--- |
| ⚠️ **Atenção** | ~60% | Refatoração para Semantic Tokens |

---

## 1. 🔍 Resumo dos Achados

O sistema possui uma base sólida com Tailwind e shadcn/ui, mas sofre de **"Color Drift"** (uso de cores arbitrárias fora do tema) e **inconsistência de componentes** (mistura de padrões shadcn com customizações manuais).

### Principais Violações (Lei #4 GEMS)
1.  **Cores Hardcoded (Crítico)**: Uso extensivo de `emerald-*`, `orange-*`, `blue-*`, `violet-*` diretamente nos componentes. Isso quebra o Dark Mode automático e dificulta mudanças de branding.
2.  **Componentes Híbridos**: O componente `GlassCard` usa opacidades manuais (`bg-white/80`) em vez de tokens do sistema (ex: `bg-background/80` ou `bg-muted/50`).
3.  **Gradientes Arbitrários**: `bg-gradient-to-r from-primary to-violet-600` introduz cores fora da paleta (violet).

---

## 2. 📝 Detalhamento por Arquivo

### `src/pages/Dashboard.tsx`
- **Problema**: Definição manual de cores para status e cards.
- **Trecho**:
    ```tsx
    // ❌ Hardcoded
    <div className="bg-emerald-500 animate-pulse" />
    <span className="text-emerald-600 dark:text-emerald-400">
    className="bg-gradient-to-r from-primary to-violet-600"
    ```
- **Solução**: Mudar para tokens semânticos:
    - `emerald` → `text-success` / `bg-success`
    - `orange` → `text-warning` / `bg-warning`
    - `violet` → `text-accent` / `bg-accent`

### `src/components/GlassCard.tsx`
- **Problema**: Estilos manuais de "glassmorphism" que não respeitam totalmente o tema.
- **Trecho**:
    ```tsx
    // ❌ Hardcoded White/Card
    bg-white/80 dark:bg-card/50
    ```
- **Solução**: Criar utilitário ou variante no `Card` do shadcn.

### `src/pages/Encomendas.tsx`
- **Problema**: Lógica de cores misturada com lógica de negócio.
- **Trecho**:
    ```tsx
    // ❌ Cores diretas
    bg-blue-50 text-blue-700
    bg-orange-100 text-orange-600
    ```

---

## 3. 🎨 Análise do Design System (`tailwind.config.ts`)

O arquivo de configuração JÁ POSSUI a estrutura necessária, mas ela está sendo ignorada.

**Tokens existentes não utilizados:**
- `success`: `hsl(var(--success))` (Provavelmente o substituto para Emerald)
- `warning`: `hsl(var(--warning))` (Provavelmente o substituto para Orange)
- `accent`: `hsl(var(--accent))`

**Faltam:**
- Tokens para "Info" (Blue)
- Tokens específicos para "Glass" (se for manter o estilo)

---

## 4. 🚀 Plano de Migração (Proposta)

Para atingir 100% de conformidade, proponho seguir esta ordem:

### Fase 1: Padronização de Tokens (Fundação)
1.  Atualizar `index.css` e `tailwind.config.ts` para garantir que `success`, `warning`, `info` cubram todos os casos de uso (emerald, orange, blue).
2.  Criar variáveis CSS para `glass-background` e `glass-border`.

### Fase 2: Refatoração de Componentes Core
1.  Atualizar `GlassCard` para usar os novos tokens `glass-*`.
2.  Atualizar `StatCard` para aceitar `variant="success"` em vez de `"emerald"`.

### Fase 3: Varredura de Páginas
1.  **Dashboard**: Substituir todas as classes de cor por utilitários semânticos e componentes refatorados.
2.  **Encomendas**: Idem.
3.  **Demais Páginas**: Aplicar o mesmo padrão (Batch fix).

---

## ✅ Próximo Passo
Aguardando aprovação para iniciar a **Fase 1: Padronização de Tokens**.
