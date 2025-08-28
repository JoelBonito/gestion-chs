-- Create a function to safely delete an order and all its related records
CREATE OR REPLACE FUNCTION public.delete_encomenda_safely(p_encomenda_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has permission to delete this order
  IF NOT EXISTS (
    SELECT 1 FROM public.encomendas 
    WHERE id = p_encomenda_id 
    AND (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = ANY(ARRAY['admin'::user_role, 'ops'::user_role])
    ))
  ) THEN
    RAISE EXCEPTION 'Permission denied or order not found';
  END IF;

  -- Delete related records in correct order
  -- 1. Delete order items first
  DELETE FROM public.itens_encomenda WHERE encomenda_id = p_encomenda_id;
  
  -- 2. Delete payments to suppliers
  DELETE FROM public.pagamentos_fornecedor WHERE encomenda_id = p_encomenda_id;
  
  -- 3. Delete payments from clients
  DELETE FROM public.pagamentos WHERE encomenda_id = p_encomenda_id;
  
  -- 4. Delete freight records
  DELETE FROM public.frete_encomenda WHERE encomenda_id = p_encomenda_id;
  
  -- 5. Delete attachments
  DELETE FROM public.attachments WHERE entity_id = p_encomenda_id::text AND entity_type IN ('receivable', 'payable');
  
  -- 6. Finally delete the order
  DELETE FROM public.encomendas WHERE id = p_encomenda_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting order: %', SQLERRM;
END;
$function$;