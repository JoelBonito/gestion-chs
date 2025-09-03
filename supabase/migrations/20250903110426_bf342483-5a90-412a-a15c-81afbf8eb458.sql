-- Fix column ambiguity in salvar_edicao_encomenda function
CREATE OR REPLACE FUNCTION public.salvar_edicao_encomenda(p_encomenda_id uuid, p_dados jsonb, p_itens jsonb)
 RETURNS TABLE(id uuid, valor_total numeric, valor_total_custo numeric, valor_pago_fornecedor numeric, saldo_devedor_fornecedor numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
  v_len int;
  v_ids_enviados int;
  v_user_role text;
begin
  -- 2.0 Segurança: só o dono pode editar OU usuários com role admin/ops
  select e.created_by into v_owner
  from public.encomendas e
  where e.id = p_encomenda_id;

  if v_owner is null then
    raise exception 'ENCOMENDA_NAO_ENCONTRADA' using errcode = 'P0002';
  end if;

  -- Verificar role do usuário atual
  select ur.role::text into v_user_role
  from public.user_roles ur
  where ur.user_id = auth.uid()
  limit 1;

  -- Permitir edição se for o dono OU se for admin/ops
  if v_owner <> auth.uid() and (v_user_role is null or v_user_role not in ('admin', 'ops')) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  -- 2.1 Atualiza dados básicos (apenas se chave existir no JSON)
  update public.encomendas e
  set
    numero_encomenda = case when p_dados ? 'numero_encomenda'
                            then p_dados->>'numero_encomenda' else e.numero_encomenda end,
    cliente_id       = case when p_dados ? 'cliente_id'
                            then (p_dados->>'cliente_id')::uuid else e.cliente_id end,
    fornecedor_id    = case when p_dados ? 'fornecedor_id'
                            then (p_dados->>'fornecedor_id')::uuid else e.fornecedor_id end,
    data_envio_estimada     = case when p_dados ? 'data_envio_estimada'
                                   then (p_dados->>'data_envio_estimada')::date else e.data_envio_estimada end,
    data_producao_estimada  = case when p_dados ? 'data_producao_estimada'
                                   then (p_dados->>'data_producao_estimada')::date else e.data_producao_estimada end,
    observacoes      = case when p_dados ? 'observacoes'
                            then p_dados->>'observacoes' else e.observacoes end,
    valor_frete      = case when p_dados ? 'valor_frete'
                            then nullif(p_dados->>'valor_frete','')::numeric else e.valor_frete end
  where e.id = p_encomenda_id;

  -- 2.2 UPSERT dos itens enviados
  --     (id opcional: se vier, atualiza; sem id, insere)
  with dados as (
    select
      nullif(itm->>'id','')::uuid             as item_id,
      (itm->>'produto_id')::uuid              as produto_id,
      coalesce((itm->>'quantidade')::numeric, 0)     as quantidade,
      coalesce((itm->>'preco_unitario')::numeric, 0) as preco_unitario
    from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) as itm
  )
  insert into public.itens_encomenda (id, encomenda_id, produto_id, quantidade, preco_unitario)
  select 
    coalesce(dados.item_id, gen_random_uuid()), 
    p_encomenda_id, 
    dados.produto_id, 
    dados.quantidade, 
    dados.preco_unitario
  from dados
  on conflict (id) do update
    set produto_id    = excluded.produto_id,
        quantidade    = excluded.quantidade,
        preco_unitario= excluded.preco_unitario;

  -- 2.3 Remoção segura dos itens que saíram:
  --     - Se nenhum item foi enviado (array vazio) -> deleta TODOS os itens da encomenda
  --     - Se vieram itens e pelo menos UM com id -> deleta os que não estão na lista
  --     - Se vieram itens só NOVOS (todos sem id) -> não deleta nada (apenas adiciona)
  select jsonb_array_length(coalesce(p_itens, '[]'::jsonb)) into v_len;
  select count(*) into v_ids_enviados
  from jsonb_array_elements(coalesce(p_itens, '[]'::jsonb)) as itm
  where nullif(itm->>'id','') is not null;

  if v_len = 0 then
    delete from public.itens_encomenda
    where encomenda_id = p_encomenda_id;
  elsif v_ids_enviados > 0 then
    delete from public.itens_encomenda i
    where i.encomenda_id = p_encomenda_id
      and i.id not in (
        select nullif(itm->>'id','')::uuid
        from jsonb_array_elements(p_itens) as itm
        where nullif(itm->>'id','') is not null
      );
  end if;

  -- 2.4 Recalcular venda e custo
  perform public.recalc_valor_total_venda_encomenda(p_encomenda_id);
  perform public.recalc_valor_total_custo_encomenda(p_encomenda_id);

  -- 2.5 Atualizar saldo do fornecedor
  update public.encomendas e
  set saldo_devedor_fornecedor = coalesce(e.valor_total_custo,0) - coalesce(e.valor_pago_fornecedor,0)
  where e.id = p_encomenda_id;

  -- 2.6 Retorno
  return query
    select e.id, e.valor_total, e.valor_total_custo, e.valor_pago_fornecedor, e.saldo_devedor_fornecedor
    from public.encomendas e
    where e.id = p_encomenda_id;
end;
$function$;