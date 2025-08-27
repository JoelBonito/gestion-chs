
-- Criar a tabela invoices
CREATE TABLE invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text,
  attachment_id uuid REFERENCES attachments(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_created_by ON invoices(created_by);

-- Habilitar RLS na tabela invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Políticas RLS usando o sistema de roles existente (user_roles table)
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'finance')
  );

-- Criar trigger para updated_at (usando a função existente)
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
