-- Add archiving columns to transportes table
ALTER TABLE public.transportes
ADD COLUMN archived boolean NOT NULL DEFAULT false,
ADD COLUMN archived_at timestamp with time zone,
ADD COLUMN archived_reason text;

-- Create index for better performance when filtering archived/active records
CREATE INDEX idx_transportes_archived ON public.transportes(archived);