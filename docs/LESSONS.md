# Lições Aprendidas e Patterns

## Frontend (React/Performance)

### 1. Perda de Foco em Formulários Complexos (O Pattern LocalInput)
**Problema:** Em formulários onde o estado é gerenciado no componente pai (ex: `EncomendaForm`) e passado para filhos (ex: `ItensEncomendaManager`), digitar em um input pode causar perda de foco ou reset do valor ("BOTOX" vira "B").
**Causa:** Cada keystroke invoca `onChange` -> Atualiza State Pai -> Re-renderiza Pai e Filhos. Se o re-render for pesado ou causar recriação de DOM (mesmo que virtual), o input perde o estado de foco.
**Solução (LocalInput / Debounce):**
Não ligar o `onChange` do input diretamente ao state do Pai. Criar um componente intermediário `LocalInput` que:
1. Mantém estado local (`useState`).
2. Atualiza o Pai apenas no `onBlur` ou via `debounce` (ex: 500ms).
3. Sincroniza props externas apenas quando necessário (ex: prop mudou e input não está focado).

**Exemplo:**
```tsx
const LocalInput = memo(({ value, onChange }) => {
  const [local, setLocal] = useState(value);
  
  const handleChange = (e) => {
    setLocal(e.target.value);
    // Debounce opcional aqui
  };

  const handleBlur = () => {
    onChange(local); // Só avisa o pai agora
  };

  return <Input value={local} onChange={handleChange} onBlur={handleBlur} />;
});
```

### 2. Cascatas de useEffect
Evitar que `useEffect` dependa de objetos complexos (arrays inteiros) se o efeito dispara atualizações de estado que recriam esse mesmo array.
**Anti-Pattern:**
```tsx
useEffect(() => {
  setTotal(itens.reduce(...)); // Atualiza pai -> recria itens
}, [itens]); // Loop ou re-renders excessivos
```
**Fix:** Usar `useRef` para comparar valores antes de disparar atualizações ou memoizar o cálculo.
