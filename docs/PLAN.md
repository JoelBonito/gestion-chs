# Plano de Implementação – Correção de Input no Formulário de Encomenda

## Contexto
O formulário de encomenda apresenta três problemas críticos que afetam a usabilidade:
1. **Perda de foco** nos campos de texto após digitar um único caractere, exigindo novo clique.
2. **Scroll inesperado** para o topo da página ao inserir números nos campos de quantidade.
3. **Valor padrão "1"** na quantidade que não pode ser apagado, resultando em valores incorretos (ex.: ao digitar "200" o campo fica "1200").

## Objetivo
Reescrever a lógica de gerenciamento de inputs para garantir:
- Manutenção do foco durante a digitação.
- Eliminação de scrolls indesejados.
- Permissão para limpar e inserir valores numéricos livremente.

## Estratégia de Solução
1. **Estabilizar chaves de lista** – já implementado com `tempId`, garantindo que componentes não sejam remontados.
2. **Separar estado de formulário** – usar `useRef` para armazenar referências dos inputs e evitar re‑renders que causem perda de foco.
3. **Controlar scroll** – remover quaisquer chamadas implícitas de `window.scrollTo` ou dependências de `react-hook-form` que possam disparar `reset` do formulário.
4. **Gerenciar valor da quantidade**:
   - Inicializar `quantidade` como `""` (string vazia) ao invés de `0` ou `1`.
   - No `onChange`, aceitar apenas dígitos e converter para número apenas na submissão.
   - Utilizar `parseInt` com fallback para `0` ao salvar.
5. **Atualizar `ItensEncomendaManager`**:
   - Substituir `input` controlado por `value={item.quantidade}` e `onChange` que atualiza o array via callback sem recriar o componente inteiro.
   - Aplicar `event.stopPropagation()` para prevenir re‑renders de pais.
6. **Testes Manuais** – validar fluxo de digitação em todos os campos (texto, número, quantidade) e confirmar ausência de scroll e perda de foco.

## Próximos Passos
- Implementar as mudanças acima nos arquivos `EncomendaForm.tsx` e `ItensEncomendaManager.tsx`.
- Atualizar tipos para refletir `quantidade` como `string` temporariamente.
- Executar testes manuais e ajustar conforme necessário.
- Atualizar documentação de uso.
