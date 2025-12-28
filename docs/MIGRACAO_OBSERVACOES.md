# Migração: Adicionar coluna observacoes à tabela clientes

## 📋 Problema Identificado
A coluna `observacoes` está sendo usada no código mas não existe no banco de dados Supabase.

## 🛠️ Solução

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor**
4. Cole e execute o seguinte SQL:

```sql
-- Migration: Add observacoes column to clientes table
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS observacoes TEXT;

COMMENT ON COLUMN clientes.observacoes IS 'Internal notes and observations about the client';
```

5. Clique em **Run** ou **Execute**

### Opção 2: Via arquivo de migração (se estiver usando Supabase CLI)

```bash
# Se você tem o Supabase CLI configurado:
supabase db push
```

## ✅ Após executar a migração

1. **Descomente o código** do campo observações em `src/components/ClienteForm.tsx`
   - Remova os comentários `//` das linhas marcadas com "Temporariamente desabilitado"
   
2. **Teste o formulário**:
   - Crie um novo cliente
   - Adicione uma observação
   - Salve e verifique se não há erros

## 🔍 Correções já aplicadas nesta sessão:

✅ **Problema dos modais sobrepostos**: Corrigido com `event.stopPropagation()` nos botões de ação
✅ **Status das encomendas**: Corrigido de "entregue" para "ENTREGUE" (maiúsculas)
✅ **Busca de estatísticas**: Já implementada corretamente no `ClienteView.tsx`
✅ **Campo observações**: Temporariamente desabilitado até a migração ser aplicada

## 📝 Próximos passos

1. Execute a migração SQL no Supabase
2. Descomente o campo observações no formulário
3. Teste a funcionalidade completa
