-- Ajustar políticas RLS para permitir visualização compartilhada de dados entre usuários autenticados
-- Remove políticas muito restritivas e adiciona políticas mais permissivas

-- Política para produtos - permitir que usuários vejam produtos de outros usuários
DROP POLICY IF EXISTS "Users can select their own active produtos" ON public.produtos;
DROP POLICY IF EXISTS "authenticated can read produtos" ON public.produtos;

-- Nova política mais permissiva para produtos
CREATE POLICY "Authenticated users can view all active products" 
ON public.produtos 
FOR SELECT 
USING (ativo = true AND auth.role() = 'authenticated');

-- Política para clientes - permitir que usuários vejam clientes de outros usuários
DROP POLICY IF EXISTS "Users can select their own active clientes" ON public.clientes;

CREATE POLICY "Authenticated users can view all active clients" 
ON public.clientes 
FOR SELECT 
USING (active = true AND auth.role() = 'authenticated');

-- Política para fornecedores - permitir que usuários vejam fornecedores de outros usuários  
DROP POLICY IF EXISTS "Users can select their own active fornecedores" ON public.fornecedores;

CREATE POLICY "Authenticated users can view all active suppliers" 
ON public.fornecedores 
FOR SELECT 
USING (active = true AND auth.role() = 'authenticated');

-- Política para encomendas - permitir que usuários vejam encomendas de outros usuários
DROP POLICY IF EXISTS "Users can select their own encomendas" ON public.encomendas;

CREATE POLICY "Authenticated users can view all orders" 
ON public.encomendas 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Política para itens_encomenda - permitir que usuários vejam itens de outros usuários
DROP POLICY IF EXISTS "Users can select itens from their own encomendas" ON public.itens_encomenda;

CREATE POLICY "Authenticated users can view all order items" 
ON public.itens_encomenda 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Manter as políticas de inserção e atualização restritas ao criador
-- Isso permite visualizar mas não modificar dados de outros usuários