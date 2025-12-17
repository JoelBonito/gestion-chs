# 📋 Plano Mestre - Migração Design System 100%

## 🎯 Objetivo
Padronizar 100% da interface do usuário do Gestion CHS utilizando o Design System (shadcn/ui + Tailwind), eliminando cores hardcoded e componentes fora do padrão.
**Meta**: Atingir score 10/10 na auditoria de design.

## User Review Required
> [!IMPORTANT]
> A migração pode alterar sutilmente a aparência de "Emerald/Orange" para os novos tons de "Success/Warning".

## 🚀 Fases da Implementação

### Fase 1: Fundação & Tokens (Prioridade Alta)
*Padronizar a base para suportar a migração sem quebra de layout.*
- [ ] **Definir Tokens Semânticos**: Adicionar `success`, `warning`, `info` no `tailwind.config.ts`.
- [ ] **Configurar Glassmorphism**: Criar tokens `glass-bg`, `glass-border` no CSS global.
- [ ] **Validar Dark Mode**: Garantir que novos tokens revertam cores corretamente no modo escuro.

### Fase 2: Componentes Core (Prioridade Alta)
*Refatorar componentes base para usar os novos tokens.*
- [ ] **Refatorar `GlassCard.tsx`**: Remover opacidades manuais e usar `bg-glass-bg`.
- [ ] **Refatorar `StatCard.tsx`**: Aceitar variantes semânticas (`success`) em vez de nomes de cor (`emerald`).
- [ ] **Refatorar `Badge`**: Garantir suporte a todas as novas variantes semânticas.

### Fase 3: Migração de Páginas (Prioridade Média)
*Aplicar as mudanças página por página.*
#### 3.1. Dashboard
- [ ] Substituir classes `text-emerald-*`, `bg-orange-*` por tokens.
- [ ] Atualizar uso de `StatCard` e `GlassCard`.

#### 3.2. Encomendas
- [ ] Remover lógica de cor misturada com estado.
- [ ] Padronizar Badges e Botões.

#### 3.3. Outras Páginas (Batch)
- [ ] Aplicar correções globais (Search & Replace inteligente).

## ✅ Critérios de Verificação
- [ ] **Audit Automatizado**: `grep` por cores hardcoded deve retornar 0 resultados (exceto exceções documentadas).
- [ ] **Visual Test**: Dark mode deve ter contraste perfeito em todos os cards.
- [ ] **Build**: `npm run build` deve passar sem erros de tipo.
