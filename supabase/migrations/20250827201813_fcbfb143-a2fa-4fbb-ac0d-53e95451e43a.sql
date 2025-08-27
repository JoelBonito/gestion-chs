-- Clean up and set correct roles for each user

-- Remove all roles from admin@admin.com first
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@admin.com');

-- Remove all roles from jbento1@gmail.com first  
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jbento1@gmail.com');

-- Keep felipe@colaborador.com with only factory role (already correct)

-- Set admin@admin.com with admin role only (full access)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::user_role 
FROM auth.users 
WHERE email = 'admin@admin.com';

-- Set jbento1@gmail.com with admin role only (full access)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin'::user_role 
FROM auth.users 
WHERE email = 'jbento1@gmail.com';