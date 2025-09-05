-- Grant restricted_fr role to specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('aea47216-874e-49cf-a392-5aedad7f3962', 'restricted_fr')
ON CONFLICT (user_id, role) DO NOTHING;