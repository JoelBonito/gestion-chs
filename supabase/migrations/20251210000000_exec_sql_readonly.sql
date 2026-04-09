-- Função segura para execução de SQL Read-Only via RPC
-- Permite que o agente execute SELECTs complexos (JOINs, Aggregations)
-- Bloqueia comandos destrutivos

CREATE OR REPLACE FUNCTION exec_sql_readonly(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com privilégios de quem criou (admin), mas valida segurança abaixo
AS $$
DECLARE
  result json;
BEGIN
  -- 1. Validação Básica de Segurança (Sanitization)
  -- Rejeita query se não começar com SELECT (case insensitive)
  IF NOT (trim(query) ~* '^SELECT') THEN
    RAISE EXCEPTION 'Apenas comandos SELECT são permitidos.';
  END IF;

  -- Rejeita palavras-chave perigosas (DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, GRANT, REVOKE)
  -- Nota: Isso é uma proteção básica. O usuário do banco usado pela Edge Function também deve ter permissões limitadas.
  IF (query ~* '\s(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE|GRANT|REVOKE)\s') THEN
    RAISE EXCEPTION 'Comandos de modificação de dados são proibidos.';
  END IF;

  -- 2. Execução da Query
  -- Retorna o resultado como JSON
  EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;

  -- Retorna array vazio se null
  IF result IS NULL THEN
    result := '[]'::json;
  END IF;

  RETURN result;
END;
$$;
