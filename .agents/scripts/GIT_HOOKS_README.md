# 🔗 Git Integration - Sistema Dual-Agent

Integração automática entre Git e o sistema de tracking de tarefas.

## Instalação

Execute o script de instalação:

```bash
bash .agents/scripts/install_git_hooks.sh
```

Isso instalará os hooks no diretório `.git/hooks/`.

## Hooks Disponíveis

### 1. post-commit (Ativo)

**Função:** Auto-atualiza progresso após commits

**Como funciona:**
- Detecta task IDs no commit message (formato: `Story-X.Y` ou `Epic-X`)
- Marca automaticamente a tarefa como concluída no BACKLOG
- Atualiza a barra de progresso

**Exemplos de commit messages:**

```bash
git commit -m "feat(Story-3.1): Implementar autenticação com Firebase"
# ✅ Marca Story 3.1 como concluída

git commit -m "fix(Story-2.3): Corrigir validação de email"
# ✅ Marca Story 2.3 como concluída

git commit -m "chore(Epic-1): Setup inicial do projeto"
# ✅ Marca Epic 1 como concluído (se aplicável)
```

**Formato recomendado:**
```
<type>(<task-id>): <description>

Onde:
- type: feat, fix, chore, docs, style, refactor, test
- task-id: Story-X.Y ou Epic-X
- description: breve descrição da mudança
```

### 2. pre-commit (Desabilitado por padrão)

**Função:** Valida ownership antes de commitar

**Status:** Comentado no script de instalação

**Para ativar:**
1. Edite `.agents/scripts/install_git_hooks.sh`
2. Descomente a seção PRE_COMMIT
3. Execute novamente o instalador

**Comportamento quando ativo:**
- Verifica se o Epic pertence ao agente atual
- Emite aviso se você está commitando no Epic de outro agente
- Não bloqueia o commit (apenas alerta)
- Use `git commit --no-verify` para ignorar

## Rastreabilidade Completa

Com os hooks instalados, você tem rastreabilidade bidirecional:

**Commit → Task:**
```bash
git log --oneline --grep="Story-3.1"
# Encontra todos os commits relacionados à Story 3.1
```

**Task → Commits:**
```bash
# No BACKLOG.md, a tarefa estará marcada como [x]
# Você pode procurar commits com o ID para ver o histórico
```

## Troubleshooting

### Hook não executou

**Problema:** O hook não marca a tarefa como concluída

**Soluções:**
1. Verifique se o script tem permissão de execução:
   ```bash
   chmod +x .git/hooks/post-commit
   ```

2. Verifique se o commit message segue o formato:
   ```bash
   # ❌ Errado
   git commit -m "fix bug in login"

   # ✅ Correto
   git commit -m "fix(Story-2.1): Corrigir bug no login"
   ```

3. Execute manualmente para ver erros:
   ```bash
   .git/hooks/post-commit
   ```

### Task já concluída

Se a tarefa já estava marcada como `[x]`, o hook exibirá um aviso mas não falhará.

### BACKLOG bloqueado

Se outro agente estiver editando o BACKLOG simultaneamente, o hook esperará até 30 segundos. Se não conseguir, emitirá mensagem e você pode reexecutar:

```bash
python3 .agents/scripts/finish_task.py 3.1
```

## Desinstalação

Para remover os hooks:

```bash
rm .git/hooks/post-commit
rm .git/hooks/pre-commit  # se instalado
```

## Integração com Workflows

Os hooks funcionam perfeitamente com os workflows existentes:

```bash
/log start          # Inicia sessão
# ... trabalha ...
git add .
git commit -m "feat(Story-3.1): Nova feature"  # ✅ Auto-marca Story 3.1
/log end            # Encerra sessão
/track              # Atualiza progresso (já foi atualizado pelo hook!)
```

## Vantagens

✅ **Zero esforço mental** - Não precisa lembrar de marcar tarefas
✅ **Rastreabilidade** - Cada task linkada a commits
✅ **Progresso atualizado** - Barra sempre sincronizada
✅ **Dual-agent friendly** - Respeita locks e ownership

## Notas

- Os hooks são locais (não versionados no Git)
- Cada desenvolvedor precisa instalá-los
- Compatível com macOS, Linux e WSL
- Python 3.10+ requerido
