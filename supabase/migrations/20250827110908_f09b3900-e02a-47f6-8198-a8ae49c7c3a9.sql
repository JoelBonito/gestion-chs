
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  attachment_id UUID REFERENCES public.attachments(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Finance and admin can do everything
CREATE POLICY "Finance and admin can manage invoices"
ON public.invoices
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('finance', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('finance', 'admin')
  )
);

-- Others can only view if they have access
CREATE POLICY "Others can view invoices"
ON public.invoices
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create invoices storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoices bucket
CREATE POLICY "Invoices bucket - finance/admin can upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('finance', 'admin')
  )
);

CREATE POLICY "Invoices bucket - everyone can view"
ON storage.objects
FOR SELECT
USING (bucket_id = 'invoices');

CREATE POLICY "Invoices bucket - finance/admin can delete"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'invoices' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('finance', 'admin')
  )
);
