// @ts-nocheck - Edge Functions usam Deno runtime (tipos não disponíveis localmente)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// === INTERFACES DE TIPAGEM ===

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

interface ToolResult {
  success: boolean;
  data?: unknown;
  count?: number;
  error?: string;
}

interface CreateProdutoArgs {
  nome: string;
  marca: string;
  tipo: string;
  preco_venda: number;
  preco_custo: number;
  fornecedor_id?: string;
}

interface CreateClienteArgs {
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { messages } = await req.json();

    // Contexto Temporal Dinâmico
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentYear = new Date().getFullYear();

    // System Prompt Blindado Anti-Alucinação (PRODUÇÃO)
    const systemPrompt = `Você é o Analista de Dados e Gestor do sistema Gestion CHS.
Sua função é fornecer relatórios precisos, cruzar dados e auxiliar na gestão empresarial.

## CONTEXTO TEMPORAL ATUAL
- Hoje é: ${today} (Ano-Mês-Dia)
- Ano Atual: ${currentYear}
- Ao fazer queries de "este mês" ou "este ano", use datas dinâmicas ou o ano atual (${currentYear}).
- Se os dados no banco forem antigos, ajuste as datas das queries para encontrar resultados (ex: tente o ano anterior se o atual estiver vazio).

## BANCO DE DADOS (PostgreSQL/Supabase)
Você tem acesso de LEITURA total via SQL a estas tabelas:

1. **produtos**
   - id (uuid), nome (text), marca (text), tipo (text)
   - preco_venda (numeric), preco_custo (numeric)
   - fornecedor_id (uuid -> fornecedores.id)
   - created_at, ativo (bool)

2. **clientes**
   - id (uuid), nome (text), email (text), telefone (text), endereco (text), active (bool)

3. **fornecedores**
   - id (uuid), nome (text), contato (text), email (text), telefone (text), active (bool)

4. **encomendas**
   - id (uuid), numero_encomenda (serial/int), status (text)
   - cliente_id (uuid -> clientes.id), fornecedor_id (uuid -> fornecedores.id)
   - valor_total (numeric), data_criacao (timestamp), observacoes (text)
   - *Status comuns*: 'NOVO PEDIDO', 'PRODUÇÃO', 'TRANSPORTE', 'ENTREGUE', 'CANCELADO'

5. **itens_encomenda**
   - id (uuid), encomenda_id (uuid -> encomendas.id)
   - produto_id (uuid -> produtos.id)
   - quantidade (int), preco_unitario (numeric), subtotal (numeric)

6. **pagamentos**
   - id (uuid), encomenda_id (uuid), valor_pagamento, data_pagamento, forma_pagamento

7. **transportes**
   - id (uuid), tracking_number (text), referencia (text), archived (bool)

## ⚠️ REGRAS ANTI-ALUCINAÇÃO (CRÍTICO - PRODUÇÃO) ⚠️

### PROTOCOLO DE VALIDAÇÃO OBRIGATÓRIO:

1. **APENAS DADOS RETORNADOS**
   🚫 NUNCA invente, estime ou deduza números.
   🚫 NUNCA mencione campos que NÃO EXISTEM no resultado da query.
   ✅ APENAS reporte campos que APARECEM no JSON retornado.

2. **VALIDAÇÃO DE CAMPOS**
   - Antes de mencionar QUALQUER informação, verifique se o campo existe no resultado.
   - Se o usuário perguntou por "fornecedor" mas sua query NÃO incluiu fornecedores:
     → Diga: "A consulta não incluiu dados de fornecedores. Preciso refazer a query."
   - Se o usuário perguntou por "cliente" mas sua query NÃO incluiu clientes:
     → Diga: "A consulta não incluiu dados de clientes. Preciso refazer a query."

3. **EXEMPLOS DE ERROS PROIBIDOS**
   ❌ ERRADO: Usuário pede "produtos por fornecedor" → Você faz SELECT p.nome, SUM(qty) → Inventa fornecedor na resposta
   ✅ CORRETO: Você detecta que a query não tem fornecedor → Refaz: SELECT p.nome, f.nome as fornecedor, SUM(qty) JOIN fornecedores f

   ❌ ERRADO: Query retorna {"nome": "X", "total": 100} → Você diz "Fornecedor Y encomendou X"
   ✅ CORRETO: Query retorna {"nome": "X", "total": 100} → Você diz "Produto X teve 100 unidades encomendadas"

4. **Fidelidade e UX (IMPORTANTE)**:
   - **ISOLAMENTO DE DADOS**: Use APENAS o JSON da execução atual. IGNORE dados de perguntas passadas.
   - Se a query retornar 3 registros e o usuário pediu 10, **MOSTRE APENAS OS 3**.
   - **PROIBIÇÃO ABSOLUTA DE PLACEHOLDERS**: Nunca use "Produto A", "Item X".
   - **Sem Dados? Converse!**: Se a busca retornar vazio (lista vazia), **NÃO RETORNE ERRO JSON**.
     - Em vez disso, responda com texto natural: "Não encontrei dados para [X] neste período..."

5. **FORMATO DE RESPOSTA (QUANDO HOUVER DADOS)**
   - NUNCA escreva texto conversacional quando retornar dados.
   - Retorne SEMPRE um bloco de código JSON com esta estrutura exata:
   
   \`\`\`json
   {
     "type": "data_report",
     "summary": "Breve frase descrevendo o resultado (ex: 'Top 10 produtos por fornecedor em 2025')",
     "data": [ ... resultados exatos da query ... ],
     "visualization": "table" // ou "list", "bar_chart" dependendo dos dados
   }
   \`\`\`

   - Se não encontrar dados, retorne:
   \`\`\`json
   {
     "type": "error",
     "message": "Nenhum dado encontrado para sua busca."
   }
   \`\`\`

5. **COMPORTAMENTO RÍGIDO**
   - Se executou SQL com sucesso -> RETORNE JSON.
   - Se precisa de mais info -> Pergunte em texto normal.
   - NÃO misture texto com JSON na mesma resposta.

## INSTRUÇÕES DE BUSCA INTELIGENTE (SQL)
1. **Tratamento de Strings e Aspas**:
   - Nomes como "Onl'us" ou "onlusbeauty" sao dificeis.
   - ESTRATEGIA DE CURINGAS: Nao busque a palavra exata. Quebre em partes.
   - EVITE: WHERE nome ILIKE '%onlusbeauty%' (Falha se tiver espaco).
   - USE: WHERE nome ILIKE '%onl%us%' ou '%onl%beauty%'.
   - Se o usuario escrever tudo junto ("brazilmulti"), separe no SQL: ILIKE '%brazil%multi%'.

2. **Datas - Seja Inclusivo**:
   - Se o usuário não pedir "este ano" explicitamente, NÃO FILTRE POR DATA.
   - Os dados podem ser futuros ou passados. Deixe o banco retornar tudo e ordene por data (ORDER BY data_criacao DESC).

3. **Filtros de Exclusão**:
   - Para "tirando X", use AND p.nome NOT ILIKE '%X%'

4. **Exemplos de Queries Corretas**:

   **Exemplo 1: Produtos mais encomendados (Tempo Total)**
   \`\`\`sql
   SELECT p.nome, SUM(ie.quantidade) as total
   FROM itens_encomenda ie
   JOIN produtos p ON ie.produto_id = p.id
   JOIN encomendas e ON ie.encomenda_id = e.id
   -- Sem filtro de data para pegar histórico completo
   GROUP BY p.nome
   ORDER BY total DESC LIMIT 10;
   \`\`\`

   **Exemplo 2: Produtos mais encomendados COM fornecedor do produto**
   \`\`\`sql
   SELECT p.nome, f.nome as fornecedor_produto, SUM(ie.quantidade) as total
   FROM itens_encomenda ie
   JOIN produtos p ON ie.produto_id = p.id
   -- Use LEFT JOIN para não perder produtos sem fornecedor
   LEFT JOIN fornecedores f ON p.fornecedor_id = f.id
   JOIN encomendas e ON ie.encomenda_id = e.id
   WHERE e.data_criacao >= DATE_TRUNC('year', CURRENT_DATE)
   GROUP BY p.nome, f.nome
   ORDER BY total DESC LIMIT 10;
   \`\`\`

   **Exemplo 3: Produtos mais encomendados COM fornecedor da encomenda**
   \`\`\`sql
   SELECT p.nome, fe.nome as fornecedor_encomenda, SUM(ie.quantidade) as total
   FROM itens_encomenda ie
   JOIN produtos p ON ie.produto_id = p.id
   JOIN encomendas e ON ie.encomenda_id = e.id
   JOIN fornecedores fe ON e.fornecedor_id = fe.id
   WHERE e.data_criacao >= DATE_TRUNC('year', CURRENT_DATE)
   GROUP BY p.nome, fe.nome
   ORDER BY total DESC LIMIT 10;
   \`\`\`

## LEMBRE-SE
- Sua credibilidade depende de ZERO alucinações.
- Em caso de dúvida, refaça a query ou peça esclarecimento.
- NUNCA preencha lacunas com informações inventadas.`;

    const tools = [
      {
        name: 'run_sql_select',
        description: 'Executa uma consulta SQL de leitura (SELECT) no banco de dados. Use para relatórios, buscas complexas, joins e contagens. Retorna JSON.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'A query SQL SELECT completa. Ex: SELECT p.nome, SUM(i.quantidade) FROM itens_encomenda i JOIN produtos p ON i.produto_id = p.id WHERE p.nome ILIKE \'%shampoo%\' GROUP BY p.nome'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'create_produto',
        description: 'Cria um novo produto',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            marca: { type: 'string' },
            tipo: { type: 'string' },
            preco_venda: { type: 'number' },
            preco_custo: { type: 'number' },
            fornecedor_id: { type: 'string' }
          },
          required: ['nome', 'marca', 'tipo', 'preco_venda', 'preco_custo']
        }
      },
      {
        name: 'create_cliente',
        description: 'Cria um novo cliente',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            email: { type: 'string' },
            telefone: { type: 'string' },
            endereco: { type: 'string' }
          },
          required: ['nome']
        }
      }
    ];

    // Configuração do Modelo Gemini Atualizado
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // INTELLIGENT MODEL SELECTOR (GATEKEEPER AI)
    // Implementação robusta para evitar obsolescência e garantir disponibilidade
    const INTELLIGENT_MODELS = [
      'gemini-2.5-flash',       // 1. Alvo Principal (Performance/Preço Ideal)
      'gemini-2.0-flash-exp',   // 2. Fallback Experimental (High Data Window)
      'gemini-1.5-flash'        // 3. Fallback Legacy Estável
    ];

    const generateContentWithFallback = async (msgs: any[], toolsList: any[]) => {
      let lastError = null;

      for (const model of INTELLIGENT_MODELS) {
        try {
          // console.log(`[Selector] Tentando modelo: ${model}`); // Debug opcional
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: msgs,
              tools: [{ function_declarations: toolsList }],
              generationConfig: { temperature: 0.0, maxOutputTokens: 4096 }
            })
          });

          if (!response.ok) {
            // Se for erro 404 (modelo não existe) ou 5xx (serviço fora), tenta o próximo
            if (response.status === 404 || response.status >= 500) {
              const txt = await response.text();
              console.warn(`[Selector] Falha no modelo ${model} (${response.status}): ${txt}. Tentando próximo...`);
              lastError = new Error(`Gemini API Error (${model}): ${txt}`);
              continue;
            }
            // Outros erros (ex: 400 Bad Request) são fatais, não adianta trocar modelo
            const txt = await response.text();
            throw new Error(`Gemini API Error (${model} - ${response.status}): ${txt}`);
          }

          return response.json(); // Sucesso!
        } catch (e) {
          lastError = e as Error;
          // Se for erro de rede/fetch, tenta o próximo
          if (e.name === 'TypeError' || e.message.includes('fetch')) {
            console.warn(`[Selector] Erro de rede no modelo ${model}. Tentando próximo...`);
            continue;
          }
          throw e; // Erro fatal re-lançado
        }
      }
      throw lastError || new Error('Todos os modelos falharam.');
    };

    // 1. Primeira Chamada ao Gemini (Via Seletor)
    const callGemini = async (msgs: GeminiContent[], toolsList: ToolDefinition[]): Promise<GeminiResponse> => {
      return generateContentWithFallback(msgs, toolsList);
    };

    // Montar histórico
    const chatContents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map((msg: Message) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    ];

    const data = await callGemini(chatContents, tools);
    const candidate = data.candidates?.[0];

    if (!candidate) throw new Error('No response from AI');

    const functionCall = candidate.content?.parts?.find((part: any) => part.functionCall);

    // Se não houve tool call, retorna o texto
    if (!functionCall) {
      const text = candidate.content?.parts?.[0]?.text || 'Sem resposta.';
      return new Response(JSON.stringify({ message: text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Processar Tool Call
    const toolName = functionCall.functionCall.name;
    const toolArgs = functionCall.functionCall.args;
    let toolResult: any;

    console.log(`[AI] Executing Tool: ${toolName}`, toolArgs);

    try {
      if (toolName === 'run_sql_select') {
        let { query } = toolArgs;

        // SANITIZAÇÃO DE SQL (Remove comentários que quebram a validação regex do RPC)
        // Remove comentários de linha (-- até o fim da linha)
        query = query.replace(/--.*$/gm, ' ').trim();
        // Remove múltiplos espaços/newlines
        query = query.replace(/\s+/g, ' ').trim();

        // LOG TEMP: Capturar SQL gerado
        console.log('[DEBUG] SQL Cleaned:', query);

        // Validação adicional de segurança (Deep Defense)
        if (!query.toUpperCase().startsWith('SELECT')) {
          console.error('[SECURITY] Query rejeitada:', query);
          throw new Error('Apenas consultas SELECT são permitidas por segurança.');
        }

        // Chamada RPC para function segura no banco
        const { data: sqlData, error: sqlError } = await supabaseClient.rpc('exec_sql_readonly', { query });

        // LOG TEMP: Capturar resultado bruto

        if (sqlError) {
          console.error('RPC Error:', sqlError);
          throw new Error(`Erro ao executar SQL: ${sqlError.message}`);
        }

        console.log('[DEBUG] Raw SQL Result:', JSON.stringify(sqlData).substring(0, 500));

        toolResult = { success: true, count: Array.isArray(sqlData) ? sqlData.length : 0, data: sqlData };

      } else if (toolName === 'create_produto') {
        const { data: prodData, error: prodError } = await supabaseClient
          .from('produtos')
          .insert({ ...toolArgs, created_by: user.id })
          .select().single();
        if (prodError) throw prodError;
        toolResult = { success: true, data: prodData };

      } else if (toolName === 'create_cliente') {
        const { data: cliData, error: cliError } = await supabaseClient
          .from('clientes')
          .insert({ ...toolArgs, created_by: user.id })
          .select().single();
        if (cliError) throw cliError;
        toolResult = { success: true, data: cliData };
      } else {
        toolResult = { success: false, error: 'Tool desconhecida' };
      }
    } catch (err: any) {
      console.error('Tool Exception:', err);
      toolResult = { success: false, error: err.message };
    }
    const toolOutputString = JSON.stringify(toolResult);
    let systemInstructionForFinalResponse = "";

    if (toolName === 'run_sql_select') {
      // O resultado do RPC é o payload 'data' dentro de toolResult
      const resultData = toolResult.data || [];
      const itemCount = Array.isArray(resultData) ? resultData.length : 0;

      if (toolResult && toolResult.error) {
        systemInstructionForFinalResponse = `SYSTEM: A query SQL falhou com o erro: "${toolResult.error}". NÃO INVENTE DADOS. Explique o erro técnico e sugira tentar novamente.`;
      } else if (itemCount === 0) {
        systemInstructionForFinalResponse = `SYSTEM: A query retornou 0 resultados. ISSO É UM FATO. NÃO INVENTE DADOS. Responda educadamente que não encontrou registros.`;
      } else {
        // Instrução DRACONIANA para fidelidade
        systemInstructionForFinalResponse = `SYSTEM: SUCESSO. A query retornou exatamente ${itemCount} registros.
SUA TAREFA É APENAS OPTAR PELO CAMINHO DA VERDADE:
1. COPIE os dados acima para o campo 'data' do seu JSON.
2. NÃO ADICIONE nenhum registro que não esteja na lista acima.
3. NÃO REMOVA nenhum registro (a menos que solicitado).
4. SE VOCÊ INVENTAR DADOS, A OPERAÇÃO FALHARÁ. SEJA MECÂNICO.`;
      }
    }

    // Chamada de Retorno (Follow-up)
    const followUpContents = [
      ...chatContents,
      { role: 'model', parts: [{ functionCall: functionCall.functionCall }] },
      {
        role: 'user',
        parts: [{
          text: `Resultado da Função ${toolName}: ${toolOutputString}\n\n${systemInstructionForFinalResponse}`
        }]
      }
    ];
    const followUpData = await callGemini(followUpContents, tools);
    const finalText = followUpData.candidates?.[0]?.content?.parts?.[0]?.text || 'Ação concluída.';

    return new Response(
      JSON.stringify({
        message: finalText,
        toolUsed: toolName,
        toolResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Fatal Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
