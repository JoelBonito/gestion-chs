
-- Remove a constraint existente e cria uma nova mais específica
DO $$
BEGIN
    -- Remove check constraint if exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'attachments_file_type_check' 
        AND table_name = 'attachments'
    ) THEN
        ALTER TABLE public.attachments DROP CONSTRAINT attachments_file_type_check;
    END IF;
END $$;

-- Criar constraint específica para os tipos de arquivo permitidos
ALTER TABLE public.attachments 
ADD CONSTRAINT attachments_file_type_check 
CHECK (
    file_type IN (
        'application/pdf',
        'text/plain',
        'image/jpeg',
        'image/jpg', 
        'image/png'
    )
);
