
-- Adicionar campos obrigatórios na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS fornecedor_id uuid REFERENCES public.fornecedores(id);

-- Adicionar campo active para soft delete em clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Adicionar campos para fornecedores
ALTER TABLE public.fornecedores 
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS catalog_url text,
ADD COLUMN IF NOT EXISTS catalog_file text;

-- Criar tabela de activity_log para auditoria
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  by_user uuid REFERENCES auth.users(id),
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  details jsonb
);

-- Adicionar RLS para activity_log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activity logs" 
ON public.activity_log 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can create activity logs" 
ON public.activity_log 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Criar tipo enum para roles de usuário
CREATE TYPE public.user_role AS ENUM ('admin', 'ops', 'client', 'factory');

-- Criar tabela de user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Adicionar RLS para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário pode editar (admin ou ops)
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops')
$$;
