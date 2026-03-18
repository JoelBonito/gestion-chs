#!/bin/bash
# Install Git Hooks - Inove AI Framework
# Instala os git hooks para integração automática do sistema dual-agent

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Instalando Git Hooks para Inove AI Framework..."
echo ""

# Verifica se está em um repositório Git
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Erro: Não é um repositório Git"
    echo "   Execute este script na raiz de um repositório Git"
    exit 1
fi

# Cria diretório de hooks se não existir
mkdir -p "$HOOKS_DIR"

# ====================
# POST-COMMIT HOOK
# ====================

POST_COMMIT="$HOOKS_DIR/post-commit"

cat > "$POST_COMMIT" << 'EOF'
#!/bin/bash
# Post-commit hook - Auto-update progress after commit
# Detecta task IDs no commit message e marca como concluídas

# Extrair task ID do commit message (ex: "feat(Story-3.1): ..." ou "fix(Epic-2): ...")
COMMIT_MSG=$(git log -1 --pretty=%B)
TASK_ID=$(echo "$COMMIT_MSG" | grep -oE '(Story|Epic|story|epic)-[0-9]+\.?[0-9]*' | sed -E 's/(Story|Epic|story|epic)-//' | head -1)

if [ -n "$TASK_ID" ]; then
    echo ""
    echo "🔄 Task detectada no commit: $TASK_ID"

    # Tenta marcar como concluída
    if python3 .agents/scripts/finish_task.py "$TASK_ID" 2>/dev/null; then
        echo "✅ Task $TASK_ID marcada como concluída"

        # Atualiza progresso
        python3 .agents/scripts/progress_tracker.py 2>/dev/null || true
    else
        echo "⚠️ Não foi possível marcar task $TASK_ID (pode já estar concluída)"
    fi
fi

exit 0
EOF

chmod +x "$POST_COMMIT"
echo "✅ post-commit hook instalado"

# ====================
# PRE-COMMIT HOOK (opcional, desabilitado por padrão)
# ====================

# Descomente para habilitar validação de ownership no pre-commit
# PRE_COMMIT="$HOOKS_DIR/pre-commit"
#
# cat > "$PRE_COMMIT" << 'EOF'
# #!/bin/bash
# # Pre-commit hook - Validação de ownership
#
# # Extrai Epic ID do commit message staged
# COMMIT_MSG=$(cat .git/COMMIT_EDITMSG 2>/dev/null || echo "")
# EPIC_NUM=$(echo "$COMMIT_MSG" | grep -oE '(Epic|epic)-[0-9]+' | sed -E 's/(Epic|epic)-//' | head -1)
#
# if [ -n "$EPIC_NUM" ]; then
#     # Detecta agente atual
#     AGENT_SOURCE=${AGENT_SOURCE:-antigravity}
#
#     # Verifica ownership no BACKLOG
#     BACKLOG="docs/BACKLOG.md"
#     if [ -f "$BACKLOG" ]; then
#         OWNER=$(grep "^## Epic $EPIC_NUM:" "$BACKLOG" | sed -nE 's/.*\[OWNER:[[:space:]]*([A-Za-z0-9_]+)\].*/\1/p')
#
#         if [ -n "$OWNER" ] && [ "$OWNER" != "$AGENT_SOURCE" ]; then
#             echo ""
#             echo "⚠️  AVISO: Epic $EPIC_NUM pertence a '$OWNER'"
#             echo "   Você está commitando como '$AGENT_SOURCE'"
#             echo ""
#             echo "   Para prosseguir, adicione justificativa ao commit message"
#             echo "   ou use --no-verify para ignorar este aviso"
#             echo ""
#
#             # Não bloqueia, apenas avisa
#         fi
#     fi
# fi
#
# exit 0
# EOF
#
# chmod +x "$PRE_COMMIT"
# echo "✅ pre-commit hook instalado"

# ====================
# Mensagem final
# ====================

echo ""
echo "🎉 Git Hooks instalados com sucesso!"
echo ""
echo "📝 Convenção de commit messages para auto-tracking:"
echo "   feat(Story-3.1): Descrição da feature"
echo "   fix(Story-2.3): Descrição do fix"
echo "   chore(Epic-1): Descrição da tarefa"
echo ""
echo "💡 O hook post-commit irá:"
echo "   - Detectar task IDs no formato 'Story-X.Y' ou 'Epic-X'"
echo "   - Marcar automaticamente como concluída no BACKLOG"
echo "   - Atualizar a barra de progresso"
echo ""
echo "✅ Pronto para uso!"
