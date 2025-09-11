-- Change tracking_number from bigint to text to accept letters and digits
ALTER TABLE public.transportes 
ALTER COLUMN tracking_number TYPE text;