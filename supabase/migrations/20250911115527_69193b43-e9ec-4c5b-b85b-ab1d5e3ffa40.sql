-- Remove the products_public view as it's a security concern and appears to be unused
-- This view duplicates data from the produtos table without proper access controls
DROP VIEW IF EXISTS public.products_public;

-- Remove the products_public table if it exists (backup table that shouldn't be there)
DROP TABLE IF EXISTS public.products_public;

-- Ensure RLS is enabled on tables that need it but don't have policies
-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles - only admins can manage roles
CREATE POLICY "Only admins can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (
  auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com'])
) 
WITH CHECK (
  auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com'])
);

-- Enable RLS on profiles table  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage profiles" 
ON public.profiles 
FOR ALL 
USING (
  auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com'])
) 
WITH CHECK (
  auth.email() = ANY(ARRAY['jbento1@gmail.com', 'admin@admin.com'])
);