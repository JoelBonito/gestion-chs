
-- Criar enum para os status das encomendas
CREATE TYPE status_encomenda AS ENUM ('NOVO PEDIDO', 'PRODUÇÃO', 'EMBALAGEM', 'TRANSPORTE', 'ENTREGUE');

-- Adicionar nova coluna de status usando o enum
ALTER TABLE public.encomendas 
ADD COLUMN status_novo status_encomenda DEFAULT 'NOVO PEDIDO' NOT NULL;

-- Atualizar registros existentes baseado no status atual
UPDATE public.encomendas 
SET status_novo = CASE 
  WHEN status = 'entregue' THEN 'ENTREGUE'::status_encomenda
  WHEN status = 'producao' THEN 'PRODUÇÃO'::status_encomenda
  WHEN status = 'enviado' THEN 'TRANSPORTE'::status_encomenda
  ELSE 'NOVO PEDIDO'::status_encomenda
END;

-- Remover a coluna antiga de status após migração
ALTER TABLE public.encomendas DROP COLUMN status;

-- Renomear a nova coluna para status
ALTER TABLE public.encomendas RENAME COLUMN status_novo TO status;
