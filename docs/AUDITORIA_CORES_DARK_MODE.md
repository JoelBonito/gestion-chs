# 🎨 Auditoria de Cores - Dark Mode

**Data:** 2024-12-26  
**Projeto:** gestion-chs  
**Versão:** 1.0

---

## 📋 Paleta de Cores Oficial

| Hierarquia | Nome | Hex | Uso |
|------------|------|-----|-----|
| **Primária** | Fundo | `#13151a` | Background geral da página |
| **Secundária** | Componentes | `#1c202a` | Cards, Modais, Seções |
| **Terciária** | Elementos internos | `#252a36` | Caixas de texto, inputs, tabelas internas |
| **Accent** | Botões de ação | `#06b6d4` | Botões cyan (Salvar, Selecionar, etc.) |

---

## 📐 Regras de Aplicação

### Hierarquia "De Fora para Dentro"

```
Camada 1 (mais externa): #13151a → Fundo da página
Camada 2 (dentro da 1):  #1c202a → Cards, Modais, Seções
Camada 3 (dentro da 2):  #252a36 → Inputs, Tabelas internas, Sub-modais
```

### Regra para Tabelas

| Elemento | Cor Correta |
|----------|-------------|
| Container da tabela | `#1c202a` |
| Header da tabela (títulos) | `#1c202a` |
| Linhas/células da tabela | `#252a36` |

---

## ✅ Estado das Páginas

### 1. Dashboard.tsx ✅ OK

**Status:** ✅ Correto

**Análise:**
- Fundo: usa `bg-background` (OK - variável do tema)
- Cards (Em Produção, Recebíveis, A Pagar): `dark:bg-[#1c202a]` ✅
- StatCards: Usam variável do tema ✅
- Itens hover: `dark:bg-white/5` ✅

**Nota:** Dashboard bem implementado com variantes do tema.

---

### 2. Projetos.tsx ✅ OK

**Status:** ✅ Correto

**Análise:**
- Barra de pesquisa: `bg-card dark:bg-[#1c202a]` ✅
- Project Cards: `bg-card dark:bg-[#1c202a]` ✅
- Ghost Card (novo projeto): `dark:hover:bg-[#1c202a]/50` ✅
- Inputs usam classes padrão do tema ✅

---

### 3. Encomendas.tsx ✅ OK (listagem)

**Status:** ✅ Correto

**Análise:**
- Barra de pesquisa: `bg-card dark:bg-[#1c202a]` ✅
- Cards de encomenda: `bg-card dark:bg-[#1c202a]` ✅

---

### 4. EncomendaView.tsx ❌ TABELA ERRADA

**Status:** ⚠️ Parcialmente Incorreto

**Problemas encontrados:**
1. **Linha 478:** Tabela usa `dark:bg-[#1c202a]` para o container ✅
2. **Linha 481:** Thead usa `dark:bg-[#13151a]/50` ❌ (deveria ser `#1c202a`)
3. **Linha 504:** Linhas da tabela: hover `dark:hover:bg-white/5` (OK para hover)
4. **Linha 528:** Footer da tabela: `dark:bg-[#13151a]/80` ❌ (deveria ser mais harmonioso)

**Correções Necessárias:**
```
Linha 481: Mudar thead de `dark:bg-[#13151a]/50` para `bg-[#1c202a]`
Linha 504: Adicionar fundo base `dark:bg-[#252a36]` nas linhas
Linha 528: Mudar tfoot de `dark:bg-[#13151a]/80` para `dark:bg-[#1c202a]`
```

---

### 5. EncomendaForm.tsx ❌ TUDO ERRADO

**Status:** ❌ Incorreto

**Problemas encontrados:**
1. **Linha 29:** `SectionStyles = "bg-[#1C202A]"` ✅ (correto)
2. **Linha 31:** `InputStyles = "bg-background"` - Depende do tema, pode não estar `#252a36`
3. **Linha 330:** SelectContent usa `bg-[#1C202A]` ✅
4. **Linha 348:** PopoverContent calendario usa `bg-[#1C202A]` ✅

**Problema Principal:**
- Os inputs (`LocalInput`) usam `bg-background` que pode não ser `#252a36`
- Deveria usar `dark:bg-[#252a36]` explicitamente para inputs

**Correções Necessárias:**
```
Linha 31: Mudar InputStyles para incluir `dark:bg-[#252a36]`
```

---

### 6. Frete.tsx ❌ SEM ESTILIZAÇÃO DARK

**Status:** ❌ Incorreto

**Problemas encontrados:**
- Usa `Card` e `Table` padrão sem customização dark mode
- Não tem nenhuma classe `dark:bg-[#xxx]`
- Tabelas usam cores padrão do componente

**Correções Necessárias:**
- Adicionar estilos dark mode em todas as tabelas e cards

---

### 7. Producao.tsx ❌ SEM ESTILIZAÇÃO DARK

**Status:** ❌ Incorreto

**Problemas encontrados:**
- Usa `Card` e `Table` padrão sem customização dark mode
- Não tem classes específicas para dark mode
- Status Cards sem personalização

**Correções Necessárias:**
- Adicionar estilos dark mode em todos os componentes

---

### 8. Financeiro.tsx ⚠️ PARCIALMENTE OK

**Status:** ⚠️ Parcialmente Correto

**Análise:**
- GlassCard: herda estilos do componente (verificar GlassCard.tsx)
- TabsList: `bg-background/40` - variável do tema
- Não tem classes dark mode explícitas

---

### 9. Clientes.tsx ❌ MUITOS ERROS

**Status:** ❌ Incorreto

**Problemas encontrados:**
1. **Linha 116:** Barra de pesquisa: `bg-background/60` - SEM dark mode específico
2. **Linha 124:** Input: `bg-background/50` - SEM dark mode específico
3. **Linha 128:** Toggle arquivados: `bg-muted/30` - SEM dark mode específico
4. **Linha 192:** Seção de detalhes: `bg-muted/30` - SEM dark mode específico

**Correções Necessárias:**
- Adicionar `dark:bg-[#1c202a]` na barra de pesquisa
- Adicionar `dark:bg-[#252a36]` nos inputs
- Revisar todas as seções de informação

---

### 10. Produtos.tsx ❌ CORES ERRADAS (HARDCODED)

**Status:** ❌ Incorreto

**Problemas encontrados:**
1. **Linha 180:** Barra de filtros: `bg-[#1a1f2e]` ❌ (deveria ser `#1c202a`)
2. **Linha 189:** Input: `bg-[#0f172a]` ❌ (deveria ser `#252a36`)
3. **Linha 201-213:** MultiSelect: `bg-[#0f172a]` ❌ (deveria ser `#252a36`)
4. **Linha 218:** Toggle arquivados: `bg-[#0f172a]` ❌ (deveria ser `#252a36`)
5. **Linha 258:** Container tabela: `bg-[#1a1f2e]` ❌ (deveria ser `#1c202a`)
6. **Linha 260:** Header tabela: `bg-[#0f172a]` ❌ (deveria ser `#1c202a`)
7. **Linha 291-294:** Linhas da tabela: hover `hover:bg-[#0f172a]/30` ❌

**Correções Necessárias:**
```
Linha 180: Mudar `bg-[#1a1f2e]` para `bg-[#1c202a]`
Linha 189: Mudar `bg-[#0f172a]` para `bg-[#252a36]`
Linha 201: Mudar `bg-[#0f172a]` para `bg-[#252a36]`
Linha 207: Mudar `bg-[#0f172a]` para `bg-[#252a36]`
Linha 213: Mudar `bg-[#0f172a]` para `bg-[#252a36]`
Linha 218: Mudar `bg-[#0f172a]` para `bg-[#252a36]`
Linha 258: Mudar `bg-[#1a1f2e]` para `bg-[#1c202a]`
Linha 260: Mudar `bg-[#0f172a]` para `bg-[#1c202a]`
Linha 294: Mudar hover para `hover:bg-[#252a36]/50`
```

---

### 11. Fornecedores.tsx ❌ MUITOS ERROS

**Status:** ❌ Incorreto

**Problemas encontrados:**
- Mesmos problemas que Clientes.tsx
- Barra de pesquisa sem dark mode específico
- Inputs sem dark mode específico
- Seções de detalhes sem dark mode específico

---

### 12. TransportesTab.tsx ✅ OK

**Status:** ✅ Correto

**Análise:**
- **Linha 192:** GlassCard: `dark:bg-[#1c202a]` ✅
- **Linha 200:** Cards de transporte: `dark:bg-[#1c202a]` ✅
- **Linha 288:** Dialog create/edit: `dark:bg-[#1c202a]` ✅
- **Linha 302-311:** Inputs: `dark:bg-[#252a36]` ✅
- **Linha 338:** Dialog view: `dark:bg-[#1c202a]` ✅

---

### 13. TarefasTab.tsx ✅ OK

**Status:** ✅ Correto

**Análise:**
- **Linha 189:** Barra de busca: `dark:bg-[#1c202a]` ✅
- **Linha 196:** Input: `dark:bg-[#252a36]` ✅
- **Linha 212:** Cards de tarefa: `dark:bg-[#1c202a]` ✅
- **Linha 257, 281, 313:** Textareas: `dark:bg-[#252a36]` ✅

---

### 14. AmostrasTab.tsx ✅ OK

**Status:** ✅ Correto

**Análise:**
- **Linha 237:** Barra de busca: `dark:bg-[#1c202a]` ✅
- **Linha 246:** Input busca: `dark:bg-[#252a36]` ✅
- **Linha 253:** Tabela container: `dark:bg-[#1c202a]` ✅
- **Linha 257:** Header tabela: `dark:bg-blue-400/5` (aceitável, cor semântica)
- **Linha 311, 500:** Popovers calendário: `bg-[#1c202a]` ✅
- **Linha 398:** Cards mobile: `dark:bg-[#1c202a]` ✅

---

## 📊 Resumo da Auditoria

| Página/Componente | Status | Prioridade |
|-------------------|--------|------------|
| Dashboard.tsx | ✅ OK | - |
| Projetos.tsx | ✅ OK | - |
| Encomendas.tsx (listagem) | ✅ OK | - |
| EncomendaView.tsx | ⚠️ Tabela | Alta |
| EncomendaForm.tsx | ❌ Inputs | Alta |
| Frete.tsx | ❌ Total | Média |
| Producao.tsx | ❌ Total | Média |
| Financeiro.tsx | ⚠️ Verificar | Baixa |
| Clientes.tsx | ❌ Muitos | Alta |
| Produtos.tsx | ❌ Cores erradas | **Crítica** |
| Fornecedores.tsx | ❌ Muitos | Alta |
| TransportesTab.tsx | ✅ OK | - |
| TarefasTab.tsx | ✅ OK | - |
| AmostrasTab.tsx | ✅ OK | - |

---

## 🎯 Plano de Implementação

### Fase 1: Crítica (Produtos.tsx)
1. Corrigir todas as cores hardcoded erradas
2. Atualizar barra de filtros para `#1c202a`
3. Atualizar inputs para `#252a36`
4. Corrigir tabela (header `#1c202a`, linhas `#252a36`)

### Fase 2: Alta Prioridade
1. **EncomendaView.tsx** - Corrigir tabela de itens
2. **EncomendaForm.tsx** - Corrigir inputs
3. **Clientes.tsx** - Adicionar classes dark mode
4. **Fornecedores.tsx** - Adicionar classes dark mode

### Fase 3: Média Prioridade
1. **Frete.tsx** - Adicionar estilos dark mode
2. **Producao.tsx** - Adicionar estilos dark mode

### Fase 4: Verificação
1. **Financeiro.tsx** - Verificar componentes internos
2. **EncomendasFinanceiro.tsx** - Verificar
3. **ContasPagar.tsx** - Verificar
4. **Invoices.tsx** - Verificar

---

## 📝 Notas Técnicas

1. **Variáveis do tema (`bg-background`, `bg-card`, etc.):**
   - Podem não estar mapeadas para as cores corretas
   - Recomendado usar valores explícitos para uniformidade

2. **Componentes que precisam verificação adicional:**
   - `GlassCard.tsx` - verificar se usa cores corretas
   - `ClienteForm.tsx` - verificar inputs
   - `FornecedorForm.tsx` - verificar inputs
   - `ProdutoForm.tsx` - verificar inputs

3. **Padrão recomendado para novos componentes:**
   ```tsx
   // Containers/Cards
   className="bg-card dark:bg-[#1c202a]"
   
   // Inputs/Caixas de texto
   className="bg-background dark:bg-[#252a36]"
   
   // Tabelas - Header
   className="bg-muted dark:bg-[#1c202a]"
   
   // Tabelas - Linhas
   className="dark:bg-[#252a36]"
   ```

---

**Fim da Auditoria**
