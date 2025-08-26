
-- Primeiro, vamos inserir o usuário JOEL na tabela auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'joel@admin.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
);

-- Depois, vamos adicionar o role de admin para o usuário JOEL
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::user_role
FROM auth.users 
WHERE email = 'joel@admin.com';
