-- Complete the financial security fix by updating pagamentos_fornecedor table
-- The existing policies for this table are already partially secure but need to be unified

-- Note: The pagamentos_fornecedor table already has some restrictive policies but also 
-- has a general "pagamentos_fornecedor_select" with "Using Expression: true"
-- We need to remove the overly permissive one and keep the restrictive ones

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "pagamentos_fornecedor_select" ON public.pagamentos_fornecedor;

-- The table already has these secure policies which we'll keep:
-- - "felipe_pagamentos_somente_fornecedores_permitidos" (for Felipe's restricted access)
-- - "outros_pagamentos_leitura_total" (for non-Felipe users)
-- These policies already properly restrict access, so no need to recreate them