-- First, create or update the functions for automatic recalculation
CREATE OR REPLACE FUNCTION public.recalc_valor_total_custo_encomenda(p_encomenda uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  update public.encomendas e
  set valor_total_custo = coalesce((
    select sum(i.quantidade * coalesce(p.preco_custo,0))
    from public.itens_encomenda i
    join public.produtos p on p.id = i.produto_id
    where i.encomenda_id = p_encomenda
  ), 0)
  where e.id = p_encomenda;
end;
$$;

-- Trigger function for itens_encomenda changes
CREATE OR REPLACE FUNCTION public.trg_itens_recalc_custo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
declare v_id uuid;
begin
  v_id := coalesce(new.encomenda_id, old.encomenda_id);
  perform public.recalc_valor_total_custo_encomenda(v_id);
  return coalesce(new, old);
end;
$$;

-- Trigger function for produtos price changes
CREATE OR REPLACE FUNCTION public.trg_produto_custo_propag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  if tg_op = 'UPDATE' and new.preco_custo is distinct from old.preco_custo then
    update public.encomendas e
    set valor_total_custo = coalesce((
      select sum(i.quantidade * coalesce(p.preco_custo,0))
      from public.itens_encomenda i
      join public.produtos p on p.id = i.produto_id
      where i.encomenda_id = e.id
    ), 0)
    where exists (
      select 1 from public.itens_encomenda i
      where i.encomenda_id = e.id and i.produto_id = new.id
    );
  end if;
  return new;
end;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_itens_recalc_custo_insert ON public.itens_encomenda;
DROP TRIGGER IF EXISTS trg_itens_recalc_custo_update ON public.itens_encomenda;
DROP TRIGGER IF EXISTS trg_itens_recalc_custo_delete ON public.itens_encomenda;
DROP TRIGGER IF EXISTS trg_produto_custo_propag ON public.produtos;

CREATE TRIGGER trg_itens_recalc_custo_insert
  AFTER INSERT ON public.itens_encomenda
  FOR EACH ROW EXECUTE FUNCTION public.trg_itens_recalc_custo();

CREATE TRIGGER trg_itens_recalc_custo_update
  AFTER UPDATE ON public.itens_encomenda
  FOR EACH ROW EXECUTE FUNCTION public.trg_itens_recalc_custo();

CREATE TRIGGER trg_itens_recalc_custo_delete
  AFTER DELETE ON public.itens_encomenda
  FOR EACH ROW EXECUTE FUNCTION public.trg_itens_recalc_custo();

CREATE TRIGGER trg_produto_custo_propag
  AFTER UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.trg_produto_custo_propag();

-- Update trigger for calculating saldo_devedor_fornecedor
CREATE OR REPLACE FUNCTION public.calcular_saldo_fornecedor()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.saldo_devedor_fornecedor = NEW.valor_total_custo - NEW.valor_pago_fornecedor;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calcular_saldo_fornecedor ON public.encomendas;
CREATE TRIGGER trg_calcular_saldo_fornecedor
  BEFORE UPDATE ON public.encomendas
  FOR EACH ROW
  WHEN (OLD.valor_total_custo IS DISTINCT FROM NEW.valor_total_custo 
        OR OLD.valor_pago_fornecedor IS DISTINCT FROM NEW.valor_pago_fornecedor)
  EXECUTE FUNCTION public.calcular_saldo_fornecedor();

-- Backfill existing data
DO $$
DECLARE
  encomenda_record RECORD;
BEGIN
  FOR encomenda_record IN 
    SELECT id FROM public.encomendas
  LOOP
    PERFORM public.recalc_valor_total_custo_encomenda(encomenda_record.id);
  END LOOP;
  
  -- Update saldo_devedor_fornecedor for all existing records
  UPDATE public.encomendas 
  SET saldo_devedor_fornecedor = valor_total_custo - valor_pago_fornecedor;
END $$;

-- Ensure unique constraint is per user
DROP INDEX IF EXISTS unique_numero_encomenda_per_user;
CREATE UNIQUE INDEX unique_numero_encomenda_per_user 
ON public.encomendas (created_by, numero_encomenda);