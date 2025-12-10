/**
 * Script para aplicar migração de estoque via Supabase Client
 * 
 * Uso:
 * node aplicar-migracao-estoque.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uxlxxcwsgfwocvfqdykf.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseServiceRoleKey) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrado');
    console.error('Configure a variável de ambiente ou use a chave anon para testes');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function aplicarMigracao() {
    console.log('🚀 Iniciando aplicação da migração de estoque...\n');

    try {
        // Executar ALTER TABLE para adicionar colunas
        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
        ALTER TABLE public.produtos
        ADD COLUMN IF NOT EXISTS estoque_garrafas INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS estoque_tampas INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS estoque_rotulos INTEGER NOT NULL DEFAULT 0;

        COMMENT ON COLUMN public.produtos.estoque_garrafas IS 'Quantidade de garrafas/potes em estoque';
        COMMENT ON COLUMN public.produtos.estoque_tampas IS 'Quantidade de tampas em estoque';
        COMMENT ON COLUMN public.produtos.estoque_rotulos IS 'Quantidade de rótulos em estoque';

        CREATE INDEX IF NOT EXISTS idx_produtos_estoque_baixo 
        ON public.produtos(estoque_garrafas, estoque_tampas, estoque_rotulos) 
        WHERE estoque_garrafas < 200 OR estoque_tampas < 200 OR estoque_rotulos < 200;
      `
        });

        if (error) {
            console.error('❌ Erro ao executar migração:', error);
            process.exit(1);
        }

        console.log('✅ Migração aplicada com sucesso!');
        console.log('\n📊 Verificando colunas criadas...');

        // Verificar se as colunas foram criadas
        const { data: verificacao, error: errorVerify } = await supabase
            .from('produtos')
            .select('estoque_garrafas, estoque_tampas, estoque_rotulos')
            .limit(1);

        if (!errorVerify) {
            console.log('✅ Colunas verificadas com sucesso!');
            console.log('\n🎉 Migração completa!');
            console.log('\n📝 Próximos passos:');
            console.log('1. Execute: npx supabase gen types typescript --project-id uxlxxcwsgfwocvfqdykf > src/integrations/supabase/types.ts');
            console.log('2. Reinicie o servidor de desenvolvimento se necessário');
        } else {
            console.error('⚠️ Aviso: Não foi possível verificar as colunas:', errorVerify);
        }

    } catch (err) {
        console.error('❌ Erro inesperado:', err);
        process.exit(1);
    }
}

aplicarMigracao();
