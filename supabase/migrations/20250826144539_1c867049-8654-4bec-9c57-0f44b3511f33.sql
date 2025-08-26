
-- Assign all roles to admin@admin.com user
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Get the user_id for admin@admin.com
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@admin.com';
    
    -- Insert all roles for the admin user (use ON CONFLICT to avoid duplicates)
    INSERT INTO public.user_roles (user_id, role) 
    VALUES 
        (admin_user_id, 'admin'),
        (admin_user_id, 'ops'),
        (admin_user_id, 'client'),
        (admin_user_id, 'factory')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'All roles assigned to admin@admin.com';
END $$;
