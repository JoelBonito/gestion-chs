import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Tool {
  name: string;
  parameters: Record<string, any>;
}

serve(async (req) => {
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

    // Verificar se é o usuário admin (jbento1@gmail.com)
    if (user.email !== 'jbento1@gmail.com') {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Esta funcionalidade está disponível apenas para administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { messages } = await req.json();

    // System prompt com conhecimento do banco de dados
    const systemPrompt = `Você é um assistente de gestão empresarial especializado em análise de dados e automação de tarefas.

Você tem acesso ao banco de dados com as seguintes tabelas principais:
- produtos (id, nome, marca, tipo, preco_venda, preco_custo, fornecedor_id, ativo)
- clientes (id, nome, email, telefone, endereco, active)
- fornecedores (id, nome, contato, telefone, email, endereco, active)
- encomendas (id, numero_encomenda, cliente_id, fornecedor_id, status, valor_total, data_criacao, observacoes)
- itens_encomenda (id, encomenda_id, produto_id, quantidade, preco_unitario, subtotal)
- pagamentos (id, encomenda_id, valor_pagamento, data_pagamento, forma_pagamento)
- transportes (id, tracking_number, referencia, archived)

Capacidades:
1. LEITURA: Executar queries SELECT para análises, relatórios e estatísticas
2. ESCRITA: Criar novos registros (produtos, clientes, fornecedores, encomendas)
3. CONVERSAÇÃO: Pedir informações faltantes de forma natural e amigável

Quando o usuário pedir para criar algo, faça perguntas uma de cada vez para coletar todas as informações necessárias.
Seja conciso, claro e útil. Sempre confirme antes de executar ações de escrita.`;

    const tools = [
      {
        name: 'query_database',
        description: 'Executa uma query SQL de leitura (SELECT) no banco de dados para buscar informações',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Query SQL SELECT para executar. Use apenas SELECT, não modifique dados.'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'create_produto',
        description: 'Cria um novo produto no sistema',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string', description: 'Nome do produto' },
            marca: { type: 'string', description: 'Marca do produto' },
            tipo: { type: 'string', description: 'Tipo do produto' },
            preco_venda: { type: 'number', description: 'Preço de venda' },
            preco_custo: { type: 'number', description: 'Preço de custo' },
            fornecedor_id: { type: 'string', description: 'UUID do fornecedor' }
          },
          required: ['nome', 'marca', 'tipo', 'preco_venda', 'preco_custo']
        }
      },
      {
        name: 'create_cliente',
        description: 'Cria um novo cliente no sistema',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string', description: 'Nome do cliente' },
            email: { type: 'string', description: 'Email do cliente' },
            telefone: { type: 'string', description: 'Telefone do cliente' },
            endereco: { type: 'string', description: 'Endereço do cliente' }
          },
          required: ['nome']
        }
      },
      {
        name: 'create_fornecedor',
        description: 'Cria um novo fornecedor no sistema',
        parameters: {
          type: 'object',
          properties: {
            nome: { type: 'string', description: 'Nome do fornecedor' },
            contato: { type: 'string', description: 'Nome do contato' },
            email: { type: 'string', description: 'Email do fornecedor' },
            telefone: { type: 'string', description: 'Telefone do fornecedor' },
            endereco: { type: 'string', description: 'Endereço do fornecedor' }
          },
          required: ['nome']
        }
      }
    ];

    // Chamar Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }]
            },
            ...messages.map((msg: Message) => ({
              role: msg.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            }))
          ],
          tools: [{
            function_declarations: tools
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));

    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new Error('No response from AI');
    }

    // Verificar se há function call
    const functionCall = candidate.content?.parts?.find((part: any) => part.functionCall);
    
    if (functionCall) {
      const toolName = functionCall.functionCall.name;
      const toolArgs = functionCall.functionCall.args;

      console.log('Tool call:', toolName, toolArgs);

      let toolResult: any;

      try {
        switch (toolName) {
          case 'query_database': {
            const query = toolArgs.query;
            // Validar que é apenas SELECT
            if (!query.trim().toLowerCase().startsWith('select')) {
              throw new Error('Apenas queries SELECT são permitidas');
            }
            
            const { data, error } = await supabaseClient.rpc('execute_sql', { query });
            if (error) throw error;
            toolResult = { success: true, data };
            break;
          }

          case 'create_produto': {
            const { data, error } = await supabaseClient
              .from('produtos')
              .insert({
                nome: toolArgs.nome,
                marca: toolArgs.marca,
                tipo: toolArgs.tipo,
                preco_venda: toolArgs.preco_venda,
                preco_custo: toolArgs.preco_custo,
                fornecedor_id: toolArgs.fornecedor_id || null,
                created_by: user.id
              })
              .select()
              .single();
            
            if (error) throw error;
            toolResult = { success: true, data };
            break;
          }

          case 'create_cliente': {
            const { data, error } = await supabaseClient
              .from('clientes')
              .insert({
                nome: toolArgs.nome,
                email: toolArgs.email || null,
                telefone: toolArgs.telefone || null,
                endereco: toolArgs.endereco || null,
                created_by: user.id
              })
              .select()
              .single();
            
            if (error) throw error;
            toolResult = { success: true, data };
            break;
          }

          case 'create_fornecedor': {
            const { data, error } = await supabaseClient
              .from('fornecedores')
              .insert({
                nome: toolArgs.nome,
                contato: toolArgs.contato || null,
                email: toolArgs.email || null,
                telefone: toolArgs.telefone || null,
                endereco: toolArgs.endereco || null,
                created_by: user.id
              })
              .select()
              .single();
            
            if (error) throw error;
            toolResult = { success: true, data };
            break;
          }

          default:
            toolResult = { success: false, error: 'Tool not found' };
        }
      } catch (error) {
        console.error('Tool execution error:', error);
        toolResult = { success: false, error: error.message };
      }

      // Fazer segunda chamada ao Gemini com o resultado do tool
      const followUpResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              },
              ...messages.map((msg: Message) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
              })),
              {
                role: 'model',
                parts: [{ functionCall: functionCall.functionCall }]
              },
              {
                role: 'user',
                parts: [{
                  functionResponse: {
                    name: toolName,
                    response: toolResult
                  }
                }]
              }
            ],
            tools: [{
              function_declarations: tools
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          }),
        }
      );

      const followUpData = await followUpResponse.json();
      const finalText = followUpData.candidates?.[0]?.content?.parts?.[0]?.text || 'Ação executada com sucesso.';

      return new Response(
        JSON.stringify({ 
          message: finalText,
          toolUsed: toolName,
          toolResult 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resposta de texto normal
    const text = candidate.content?.parts?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.';

    return new Response(
      JSON.stringify({ message: text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
