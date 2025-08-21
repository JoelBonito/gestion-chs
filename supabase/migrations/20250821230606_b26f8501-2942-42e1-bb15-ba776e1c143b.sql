
-- Criar enum para roles de usuário
CREATE TYPE user_role AS ENUM ('admin', 'ops', 'client', 'factory');

-- Criar tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem seus próprios perfis
CREATE POLICY "Users can view own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Política para usuários atualizarem seus próprios perfis
CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Política para inserção automática de perfis
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar a tabela user_roles existente para usar o novo enum
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE user_role USING role::user_role;

-- Adicionar políticas para admins gerenciarem roles
CREATE POLICY "Admins can manage all roles" 
  ON public.user_roles 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

-- Criar função para verificar se pode editar (admin ou ops)
CREATE OR REPLACE FUNCTION public.can_edit()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops')
$$;

-- Inserir usuários de exemplo com roles
-- Nota: Estes são apenas exemplos para estrutura, os usuários reais precisam ser criados via auth
INSERT INTO public.user_roles (user_id, role) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid, 'admin'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
);

INSERT INTO public.user_roles (user_id, role) 
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid, 'ops'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '00000000-0000-0000-0000-000000000002'::uuid
);

INSERT INTO public.user_roles (user_id, role) 
SELECT 
  '00000000-0000-0000-0000-000000000003'::uuid, 'client'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = '00000000-0000-0000-0000-000000000003'::uuid
);
