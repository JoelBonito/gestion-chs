# INOVE AI - DESIGN SYSTEM V2 (2025)
**Status:** Consolidado
**Aplicação:** Todo o Web App (Gestion CHS)
**Última Atualização:** 28/12/2024

Este documento define os padrões oficiais de UI/UX estabelecidos após a refatoração completa do sistema. Todos os novos desenvolvimentos devem seguir estritamente estas diretrizes.

---

## 1. Sistema de Cores e Camadas (4-Layer System)

A arquitetura visual baseia-se em profundidade através de camadas. O contraste é a chave para a legibilidade.

### Dark Mode (Padrão)
| Camada | Token Tailwind | Hex Code | Aplicação |
| :--- | :--- | :--- | :--- |
| **Layer 1** | `bg-background` | `#0f1116` | Fundo base das abas principais (ex: Fundo da página). |
| **Layer 2** | `bg-card` | `#1C202A` | **Modais (`DialogContent`)**, Cards Principais, Tabelas. |
| **Layer 3** | `bg-popover` | `#2d3342` | **Seções de Formulários**, Cards de Informação Internos, Headers de Visualização. |
| **Layer 4** | `bg-accent` | `#252a36` | **Inputs**, Campos de Texto, Detalhes profundos, Observações. |
| **Layer 5** | N/A | `#2d3342` | Sidebar, Item Selecionado. |

### Light Mode
| Camada | Token Tailwind | Hex Code | Aplicação |
| :--- | :--- | :--- | :--- |
| **Layer 1** | `bg-background` | `#f9fafb` | Fundo base. |
| **Layer 2** | `bg-card` | `#f1f2f4` | Modais. |
| **Layer 3** | `bg-popover` | `#f9fafb` | Seções. |
| **Layer 4** | `bg-accent` | `#ffffff` | Inputs. |
| **Layer 5** | N/A | `#e0e7e6` | Sidebar. |

---

## 2. Componentes e Padrões

### 2.1. Modais (`Dialog`)
*   **Container:** Deve usar sempre **Layer 2** (`bg-card`).
*   **Classe Padrão:** `className="bg-card border-none shadow-2xl ..."`
*   **Header:** Pode herdar a cor do modal ou usar Layer 3 para destaque se necessário.

### 2.2. Formulários
*   **Estrutura:** Dividido em "Seções" visuais.
*   **Seções (`div`):** Devem usar **Layer 3** (`bg-popover`) para se separar do fundo do modal.
    *   *Ex:* `bg-popover border border-border/20 rounded-xl p-5`.
*   **Inputs (`Input`, `Select`, `Textarea`):** Devem usar **Layer 4** (`bg-accent`) para criar o campo "escavado" ou destacado sobre a seção.
    *   *Ex:* `bg-accent border-border/50`.
*   **Labels:** Uppercase, Bold, Text-Muted-Foreground, Text-XS (`text-[10px] uppercase font-bold tracking-wider`).

### 2.3. Botões
#### Botão de Ação (Primary)
*   **Cor:** Cyan (`#06b6d4`) ou Gradiente Teal (`#457b77`).
*   **Variante:** `variant="gradient"`
*   **Uso:** Salvar, Criar, Adicionar, Finalizar.

#### Botão Cancelar
*   **Regra:** "O botão cancelar fica sempre numa cor um tom acima do tom onde ele se insere." (Geralmente transparente ou Layer 3).
*   **Variante:** `variant="cancel"`
*   **Comportamento:**
    *   Normal: Texto discreto (`text-muted-foreground`), fundo do pai ou `bg-popover`.
    *   Hover: **Efeito Vermelho** (`hover:bg-red-500 hover:text-white`).
*   **Implementação:** Não adicionar classes de cor manuais (`hover:text-destructive`, etc). Usar apenas `variant="cancel"`.

---

## 3. UI/UX Refinements

### 3.1. Inputs Numéricos
*   **Regra:** Não exibir "spinners" (setas para cima/baixo) em inputs numéricos e de moeda.
*   **Implementação:** Usar classe utilitária `.no-spinner` ou componente `LocalInput` configurado.

### 3.2. Responsividade
*   **Tabelas:** Em Mobile, converter linhas de tabela em **Cards** (Layer 2 ou 3).
*   **Modais:** `w-[95vw]` e `max-h-[90vh]` para garantir uso seguro em mobile.

---

## 4. Estrutura de Diretórios (Governança)
*   `src/components/ui`: Componentes Shadcn/Radix (design system base).
*   `docs/`: Documentação técnica.
*   `src/pages`: Páginas / Telas inteiras.

## 5. Manutenção
Qualquer alteração neste Design System deve ser refletida aqui. A consistência visual é prioritária sobre a velocidade de implementação.
