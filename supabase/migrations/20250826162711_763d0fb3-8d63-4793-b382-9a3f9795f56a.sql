
-- Verificar se existe constraint de file_type na tabela attachments e removê-la se existir
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

-- Criar uma constraint mais permissiva que aceita tipos de arquivo comuns
ALTER TABLE public.attachments 
ADD CONSTRAINT attachments_file_type_check 
CHECK (
    file_type ~ '^(image|application|text|video|audio)\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*$'
);
