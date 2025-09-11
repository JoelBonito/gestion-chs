-- Enable RLS on invoices_backup table to fix security warning
ALTER TABLE public.invoices_backup ENABLE ROW LEVEL SECURITY;

-- Create basic policies for invoices_backup (following same pattern as invoices table)
CREATE POLICY "invoices_backup_select" 
ON public.invoices_backup 
FOR SELECT 
USING (true);

CREATE POLICY "invoices_backup_insert" 
ON public.invoices_backup 
FOR INSERT 
WITH CHECK ((auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])));

CREATE POLICY "invoices_backup_update" 
ON public.invoices_backup 
FOR UPDATE 
USING ((auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])));

CREATE POLICY "invoices_backup_delete" 
ON public.invoices_backup 
FOR DELETE 
USING ((auth.email() = ANY (ARRAY['jbento1@gmail.com'::text, 'admin@admin.com'::text])));