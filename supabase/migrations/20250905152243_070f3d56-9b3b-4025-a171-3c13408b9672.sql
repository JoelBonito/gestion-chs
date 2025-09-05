-- Add restricted_fr role to user_roles enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'restricted_fr'
    ) THEN
        ALTER TYPE public.app_role ADD VALUE 'restricted_fr';
    END IF;
END$$;

-- Grant restricted_fr role to specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('aea47216-874e-49cf-a392-5aedad7f3962', 'restricted_fr')
ON CONFLICT (user_id, role) DO NOTHING;