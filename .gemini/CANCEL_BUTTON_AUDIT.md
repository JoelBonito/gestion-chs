# Auditoria de Botões Cancelar - Sistema de Camadas

## Regra de Camadas:
- **Camada 1 (Base/Modal)**: `#13151a` dark → Botão: `#1c202a` (Camada 2)
- **Camada 2 (Cards/Sections)**: `#1c202a` dark → Botão: `#252a36` (Camada 3)  
- **Camada 3 (Elevated)**: `#252a36` dark → Botão: próxima camada

## Mapeamento de Contextos:

### FloatingTopBar.tsx - Modal de Editar Nome
- **Container**: Dialog padrão (Camada 1)
- **Botão Atual**: `variant="cancel"` (padrão #1c202a) ✅ CORRETO
- **Ação**: Nenhuma

### ClienteForm.tsx
- **Container**: Sections com `bg-[#1C202A]` (Camada 2)
- **Botão Atual**: `variant="cancel"` (padrão #1c202a) ❌ INCORRETO
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### FornecedorForm.tsx  
- **Container**: Sections com `bg-card` (~#1c202a Camada 2)
- **Botão Atual**: `variant="cancel"` ❌ INCORRETO
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### EncomendaForm.tsx
- **Container**: Sections com `bg-[#1C202A]` (Camada 2)
- **Botão Atual**: `variant="cancel"` ❌ INCORRETO
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### EncomendaTransportForm.tsx
- **Container**: Sections com `bg-card` (Camada 2)
- **Botão Atual**: `variant="cancel"` ❌ INCORRETO
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### ProdutoForm.tsx
- **Container**: Card padrão (Camada 2)
- **Botão Atual**: `variant="cancel"` ❌ INCORRETO  
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### AmostraForm.tsx
- **Container**: `bg-[#1c202a]` (Camada 2)
- **Botão Atual**: `variant="cancel"` ❌ INCORRETO
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### ProjetoForm.tsx
- **Container**: Card com `bg-[#1c202a]` (Camada 2)
- **Botão Atual**: `variant="cancel"` ❌ INCORRETO
- **Ação**: Adicionar `className="dark:bg-[#252a36]"`

### EstoqueEditModal.tsx
- **Container**: DialogContent padrão (Camada 1)
- **Botão Atual**: `variant="cancel"` ✅ CORRETO
- **Ação**: Nenhuma

### EncomendaView.tsx (Obs inline)
- **Container**: Variável (verificar contexto específico)
- **Ação**: Revisar caso a caso

## Resumo Ações:
- ✅ 2 já corretas (modals camada 1)
- ❌ 7 precisam de `className="dark:bg-[#252a36]"` (forms em camada 2)
