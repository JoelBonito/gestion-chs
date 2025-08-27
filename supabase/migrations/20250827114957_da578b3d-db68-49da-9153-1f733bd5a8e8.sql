
-- Fix Missing RLS Policies for Profiles Table
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles  
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Secure Database Functions - Add proper security settings
CREATE OR REPLACE FUNCTION public.atualizar_valor_pago_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  -- Recalcular o valor_pago_fornecedor da encomenda
  IF TG_OP = 'DELETE' THEN
    UPDATE public.encomendas 
    SET valor_pago_fornecedor = COALESCE((
      SELECT SUM(valor_pagamento) 
      FROM public.pagamentos_fornecedor 
      WHERE encomenda_id = OLD.encomenda_id
    ), 0)
    WHERE id = OLD.encomenda_id;
    RETURN OLD;
  ELSE
    UPDATE public.encomendas 
    SET valor_pago_fornecedor = COALESCE((
      SELECT SUM(valor_pagamento) 
      FROM public.pagamentos_fornecedor 
      WHERE encomenda_id = NEW.encomenda_id
    ), 0)
    WHERE id = NEW.encomenda_id;
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calcular_saldo_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  NEW.saldo_devedor_fornecedor = NEW.valor_total_custo - NEW.valor_pago_fornecedor;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.atualizar_valor_total_com_frete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  -- Recalcular o valor_total da encomenda incluindo frete
  UPDATE public.encomendas 
  SET valor_total = COALESCE((
    SELECT SUM(subtotal) 
    FROM public.itens_encomenda 
    WHERE encomenda_id = NEW.encomenda_id
  ), 0) + COALESCE(NEW.valor_frete, 0)
  WHERE id = NEW.encomenda_id;
  
  RETURN NEW;
END;
$function$;

-- Replace overly permissive RLS policies with role-based access control
-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public access to create customers" ON public.clientes;
DROP POLICY IF EXISTS "Allow public access to delete customers" ON public.clientes;
DROP POLICY IF EXISTS "Allow public access to update customers" ON public.clientes;
DROP POLICY IF EXISTS "Allow public access to view customers" ON public.clientes;

DROP POLICY IF EXISTS "Permitir acesso total a encomendas" ON public.encomendas;
DROP POLICY IF EXISTS "Permitir acesso total a fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Permitir acesso total ao frete" ON public.frete_encomenda;
DROP POLICY IF EXISTS "Permitir acesso total a itens_encomenda" ON public.itens_encomenda;
DROP POLICY IF EXISTS "Permitir acesso total a pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Permitir acesso total a pagamentos_fornecedor" ON public.pagamentos_fornecedor;

-- Create secure, role-based RLS policies for clientes
CREATE POLICY "Authenticated users can view customers" ON public.clientes
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and ops can manage customers" ON public.clientes
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

-- Create secure RLS policies for encomendas
CREATE POLICY "Authenticated users can view orders" ON public.encomendas
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and ops can manage orders" ON public.encomendas
FOR INSERT TO authenticated 
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Admin and ops can update orders" ON public.encomendas
FOR UPDATE TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Admin can delete orders" ON public.encomendas
FOR DELETE TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Create secure RLS policies for fornecedores
CREATE POLICY "Authenticated users can view suppliers" ON public.fornecedores
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and ops can manage suppliers" ON public.fornecedores
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

-- Create secure RLS policies for financial data (restrict to admin and finance roles)
CREATE POLICY "Finance and admin can view payments" ON public.pagamentos
FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance and admin can manage payments" ON public.pagamentos
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance and admin can view supplier payments" ON public.pagamentos_fornecedor
FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance and admin can manage supplier payments" ON public.pagamentos_fornecedor
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance'));

-- Create secure RLS policies for other tables
CREATE POLICY "Authenticated users can view order items" ON public.itens_encomenda
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and ops can manage order items" ON public.itens_encomenda
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Authenticated users can view freight" ON public.frete_encomenda
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and ops can manage freight" ON public.frete_encomenda
FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));
