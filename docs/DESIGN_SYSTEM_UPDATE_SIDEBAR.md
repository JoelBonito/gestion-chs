# Atualização do Design System - Sidebar Toggle

> **Data:** 22/12/2025
> **Componente:** Sidebar Trigger
> **Tipo:** Update Visual

Abaixo está a definição do novo botão de alternância da Sidebar, que deve ser adotado como padrão.

## Especificações

- **Posição:** Absolute, centralizado verticalmente ou alinhado ao topo, sobreposto à borda direita da sidebar (`-right-3`).
- **Formato:** Circular (`rounded-full`).
- **Tamanho:** `h-7 w-7` (28px).
- **Estilo:**
    - Background: `bg-sidebar` (ou surface).
    - Border: `border border-border`.
    - Shadow: `shadow-sm`.
- **Ícone:** `ChevronLeft` (rotaciona 180 graus quando colapsado).

## Exemplo de Implementação (React + Tailwind)

```tsx
<Button
  onClick={toggleSidebar}
  variant="outline"
  size="icon"
  className="absolute -right-3 top-8 z-20 h-7 w-7 rounded-full border border-border bg-sidebar shadow-sm hover:bg-accent hover:text-accent-foreground"
>
  <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
</Button>
```
