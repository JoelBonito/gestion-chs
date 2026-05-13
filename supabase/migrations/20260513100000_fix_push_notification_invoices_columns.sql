-- Fix push notification trigger function that references non-existent columns on `invoices`
-- The previous version referenced NEW.tipo and NEW.valor which do not exist in invoices
-- (invoices has `amount`, not `valor`; and has no `tipo` column).
-- This causes INSERT on invoices to fail with SQLSTATE 42703.

CREATE OR REPLACE FUNCTION notify_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  notification_title TEXT;
  notification_body TEXT;
  notification_url TEXT;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'encomendas' THEN
      IF TG_OP = 'INSERT' THEN
        notification_title := '📦 Nova Encomenda';
        notification_body := 'Encomenda #' || NEW.numero_encomenda || ' criada';
        notification_url := '/encomendas';
      ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        notification_title := '🔄 Status Atualizado';
        notification_body := 'Encomenda #' || NEW.numero_encomenda || ' → ' || NEW.status::TEXT;
        notification_url := '/encomendas';
      ELSE
        RETURN NEW;
      END IF;

    WHEN 'invoices' THEN
      IF TG_OP = 'INSERT' THEN
        notification_title := '📄 Nova Fatura';
        notification_body := 'Fatura registada: €' || COALESCE(NEW.amount::TEXT, '0');
        notification_url := '/financeiro';
      ELSE
        RETURN NEW;
      END IF;

    ELSE
      RETURN NEW;
  END CASE;

  payload := jsonb_build_object(
    'title', notification_title,
    'body', notification_body,
    'url', notification_url
  );

  BEGIN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := payload
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Push notification payload: %', payload;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
