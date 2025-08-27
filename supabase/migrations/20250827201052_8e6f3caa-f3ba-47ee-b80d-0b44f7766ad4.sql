-- Add factory user to user_roles table
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'factory'::user_role 
FROM auth.users 
WHERE email = 'felipe@colaborador.com'
ON CONFLICT (user_id, role) DO NOTHING;