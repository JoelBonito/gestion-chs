---
description: Cria documentação detalhada de jornadas de usuário baseadas em personas, transformando requisitos abstratos em histórias concretas e memoráveis.
---

# Workflow: /journeys

> **Propósito:** Documentar jornadas de usuário completas que contextualizam os requisitos e ajudam devs a entender a INTENÇÃO por trás de cada feature.

## Quando Usar

- Após completar `/define` (Product Brief + PRD)
- Quando precisar detalhar fluxos complexos
- Para criar casos de teste baseados em cenários reais

## Regras Críticas

1. **BASEIE-SE NAS PERSONAS** do Product Brief
2. **SEJA ESPECÍFICO** - contextos, emoções, pensamentos
3. **INCLUA CONFLITOS** - o que pode dar errado e como resolver
4. **CONECTE AOS REQUISITOS** - cada jornada mapeia para FRs

---

## Fluxo de Execução

### Fase 0: Coleta de Contexto

Antes de criar jornadas, leia (procurar em `docs/01-Planejamento/` ou fallback `docs/planning/`):
1. `01-product-brief.md` (Personas)
2. `02-prd.md` (Requisitos Funcionais)

Pergunte ao usuário se necessário:
```markdown
🎯 Para criar jornadas precisas, preciso entender melhor:

1. **Qual é o cenário mais comum de uso do sistema?**
   - Quando/onde o usuário típico usa?
   - Com que frequência?

2. **Qual é o maior "momento de alívio" que o produto proporciona?**
   - O que faz o usuário pensar "valeu a pena"?

3. **Quais são os 3 principais pontos de frustração que o usuário pode ter?**
   - Onde as coisas podem dar errado?
```

---

### Fase 1: Estrutura do Documento

**Output:** `docs/01-Planejamento/user-journeys.md` (ou `docs/planning/user-journeys.md` se alias ativo)

```markdown
# User Journeys: {Nome do Projeto}

## Metadados
- **Baseado em:** 01-product-brief.md, 02-prd.md
- **Data:** {YYYY-MM-DD}
- **Personas coberturas:** {Lista de personas}

---

## Índice de Jornadas

| # | Jornada | Persona | FRs Cobertos | Tipo |
|---|---------|---------|--------------|------|
| 1 | [Nome] | [Persona] | RF01, RF02 | Happy Path |
| 2 | [Nome] | [Persona] | RF03, RF04 | Happy Path |
| 3 | [Nome] | [Persona] | RF05 | Recovery |
| 4 | [Nome] | [Persona] | RF06 | Edge Case |

---

## Legenda de Tipos

- **Happy Path:** Fluxo ideal sem problemas
- **Recovery:** Como o sistema se recupera de falhas
- **Edge Case:** Cenários limite ou incomuns
- **First Time:** Experiência do primeiro uso
- **Power User:** Uso avançado por usuários experientes
```

---

### Fase 2: Jornada Happy Path Principal

Crie a jornada principal que representa o uso mais comum:

```markdown
## Jornada 1: {Nome Descritivo}

> **Tipo:** Happy Path
> **Persona:** {Nome da Persona}
> **FRs Cobertos:** RF01, RF02, RF03

### Contexto

**Quem:** {Nome}, {Cargo/Papel}
**Quando:** {Momento específico - ex: Segunda-feira de manhã, após reunião}
**Onde:** {Local - ex: Escritório, home office, celular no trânsito}
**Estado emocional inicial:** {Ex: Frustrado com processo manual, ansioso por deadline}

### Background

{2-3 frases descrevendo a situação que levou o usuário a usar o sistema}

> Exemplo: Carlos acabou de sair de uma reunião onde prometeu enviar uma proposta
> até às 18h. São 14h e ele ainda precisa montar o orçamento, criar o documento
> e revisar com o time. Ele está tenso porque já perdeu clientes por demorar demais.

---

### A Jornada

#### Passo 1: {Nome do Passo}

**Ação do usuário:**
{O que o usuário faz - seja específico}

**Resposta do sistema:**
{O que o sistema mostra/faz}

**Pensamento do usuário:**
> "{Frase que o usuário pensaria neste momento}"

**Tempo estimado:** {Ex: 5 segundos}

**FRs envolvidos:** RF01

---

#### Passo 2: {Nome do Passo}

**Ação do usuário:**
{Descrição}

**Resposta do sistema:**
{Descrição}

**Pensamento do usuário:**
> "{Frase}"

**Tempo estimado:** {X segundos/minutos}

**FRs envolvidos:** RF02

---

#### Passo 3: {Nome do Passo}
[Continuar formato...]

---

### Clímax (Momento de Valor)

**O que acontece:**
{Descreva o momento em que o usuário percebe o valor do produto}

**Reação do usuário:**
> "{Frase de satisfação/alívio}"

**Métricas de sucesso:**
- Tempo total da jornada: {X minutos}
- Cliques necessários: {N}
- Erros encontrados: 0

---

### Resultado Final

**Estado emocional final:** {Ex: Aliviado, confiante, impressionado}
**Próxima ação provável:** {O que o usuário faz depois}
**Valor entregue:** {Qual problema foi resolvido}
```

---

### Fase 3: Jornada de Recovery

Crie uma jornada mostrando como o sistema lida com problemas:

```markdown
## Jornada 2: {Nome - Recovery}

> **Tipo:** Recovery
> **Persona:** {Nome}
> **FRs Cobertos:** RF05, RF06

### Contexto

**Quem:** {Nome}, {Papel}
**Situação:** {Algo deu errado - ex: conexão caiu, erro de validação, timeout}

### Background

{Descreva a situação problemática}

> Exemplo: Juliana estava no meio de um processo importante quando o Wi-Fi
> do escritório caiu. Ela não sabe se os dados foram salvos ou se precisa
> começar tudo de novo.

---

### O Conflito

**O que aconteceu:**
{Descrição técnica do problema}

**Impacto para o usuário:**
{O que o usuário perderia se não houvesse recovery}

**Reação inicial do usuário:**
> "{Pensamento de preocupação}"

---

### A Recuperação

#### Detecção (Automática)

**O sistema detecta:**
{Como o sistema identifica o problema}

**Ação automática:**
{O que o sistema faz sem intervenção do usuário}

**Feedback visual:**
{O que o usuário vê - ex: toast, badge, modal}

---

#### Resolução

**Quando a situação se normaliza:**
{Ex: Wi-Fi volta, usuário corrige input}

**O sistema:**
{O que o sistema faz automaticamente}

**Resultado:**
{Estado final - dados preservados, processo continua, etc}

**Pensamento do usuário:**
> "{Frase de alívio - ex: 'Ufa, não perdi nada!'}"

---

### Garantias do Sistema

| Cenário | Garantia | Como |
|---------|----------|------|
| Queda de conexão | Zero perda de dados | Auto-save a cada X segundos |
| Timeout de API | Retry automático | 3 tentativas com backoff |
| Erro de validação | Mensagem clara | Highlight do campo + dica |
| Sessão expirada | Preserva estado | Redirect + restore após login |
```

---

### Fase 4: Jornada de Primeiro Uso (Onboarding)

```markdown
## Jornada 3: Primeiro Contato

> **Tipo:** First Time
> **Persona:** {Nome - novo usuário}
> **FRs Cobertos:** RF-ONBOARDING

### Contexto

**Quem:** {Nome}, nunca usou o sistema
**Como chegou:** {Ex: Indicação, busca Google, anúncio}
**Expectativa:** {O que espera encontrar}
**Preocupação:** {Medo de ser complicado, perder tempo, etc}

---

### Jornada de Descoberta

#### Momento 1: Primeira Impressão (0-5 segundos)

**O que vê:**
{Landing page, tela de login, dashboard vazio}

**Pensamento:**
> "{Primeira reação}"

**Decisão:**
{Continua ou abandona}

---

#### Momento 2: Primeiros Passos (1-3 minutos)

**Guia oferecido:**
{Tutorial, wizard, tooltips, vídeo}

**Ação do usuário:**
{Segue o guia ou explora sozinho}

**Marcos de progresso:**
- [ ] Criou conta
- [ ] Completou perfil
- [ ] Realizou primeira ação core
- [ ] Viu primeiro resultado

---

#### Momento 3: "Aha Moment"

**O que é:**
{O momento em que o usuário entende o valor}

**Quando acontece:**
{Após qual ação}

**Indicadores:**
- Tempo até Aha: {X minutos}
- Ações necessárias: {N}

**Pensamento:**
> "{Frase de entendimento - 'Ah, é isso que faz!'}"

---

### Métricas de Onboarding

| Métrica | Target | Descrição |
|---------|--------|-----------|
| TTFV (Time to First Value) | < 3 min | Tempo até primeira ação de valor |
| Completion Rate | > 70% | % que completa onboarding |
| Drop-off Points | < 20% por step | Onde usuários abandonam |
```

---

### Fase 5: Jornadas de Edge Cases

```markdown
## Jornada 4: [Edge Case Específico]

> **Tipo:** Edge Case
> **Persona:** {Nome}
> **FRs Cobertos:** RF-XX

### Cenário

**Situação incomum:**
{Descreva o caso limite}

> Exemplo: Usuário tenta fazer upload de um arquivo de 500MB quando o limite é 100MB.

---

### Tratamento

**Detecção:**
{Como o sistema identifica}

**Feedback:**
{Mensagem clara e acionável}

```
❌ Arquivo muito grande

O arquivo selecionado tem 500MB, mas o limite é 100MB.

Sugestões:
• Comprima o arquivo antes de enviar
• Divida em partes menores
• Faça upgrade do plano para limite de 1GB

[Comprimir Online] [Escolher Outro]
```

**Alternativas oferecidas:**
{Opções que o usuário tem}

**Resultado esperado:**
{O que o usuário consegue fazer}
```

---

### Fase 6: Mapa de Jornadas vs Requisitos

```markdown
## Matriz de Cobertura

### Requisitos por Jornada

| FR | Jornada 1 | Jornada 2 | Jornada 3 | Jornada 4 | Cobertura |
|----|-----------|-----------|-----------|-----------|-----------|
| RF01 | ✅ | - | ✅ | - | 2 jornadas |
| RF02 | ✅ | - | - | - | 1 jornada |
| RF03 | ✅ | ✅ | - | - | 2 jornadas |
| RF04 | - | - | ✅ | - | 1 jornada |
| RF05 | - | ✅ | - | ✅ | 2 jornadas |

### FRs Sem Jornada Documentada
| FR | Descrição | Ação Sugerida |
|----|-----------|---------------|
| RF10 | [Desc] | Criar jornada para Admin |

### Estatísticas
- Total de FRs: {N}
- FRs com jornada: {X}
- Cobertura: {X/N * 100}%
```

---

## Template de Jornada Rápida

Para jornadas menores ou variações:

```markdown
## Jornada X: {Nome}

**Persona:** {Nome} | **Tipo:** {Tipo} | **FRs:** {Lista}

### Resumo
{1-2 frases descrevendo a jornada}

### Passos
1. {Ação} → {Resultado} → "{Pensamento}"
2. {Ação} → {Resultado} → "{Pensamento}"
3. {Ação} → {Resultado} → "{Pensamento}"

### Valor Entregue
{O que o usuário ganha}

### Possíveis Problemas
- {Problema 1} → {Solução}
- {Problema 2} → {Solução}
```

---

## Pós-Execução

```markdown
## 📋 User Journeys Criadas!

**Arquivo:** `docs/01-Planejamento/user-journeys.md` (ou `docs/planning/`)

### Resumo
- **Jornadas criadas:** {N}
- **Personas cobertas:** {Lista}
- **FRs cobertos:** {X}/{Total} ({%})

### Tipos de Jornada
- Happy Path: {N}
- Recovery: {N}
- First Time: {N}
- Edge Cases: {N}

### Próximos Passos
1. Revisar jornadas com stakeholders
2. Usar jornadas como base para testes E2E
3. Rodar `/readiness` para validar documentação completa
```
