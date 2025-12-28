-- Tabela para armazenar as inscrições de Push Notification
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- Drop policy if exists to avoid error on replay
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias inscrições" ON push_subscriptions;
CREATE POLICY "Usuários podem gerenciar suas próprias inscrições" 
ON push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Trigger Function Fix
CREATE OR REPLACE FUNCTION notify_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  notification_title TEXT;
  notification_body TEXT;
  notification_url TEXT;
BEGIN
  -- Determinar o tipo de evento e construir a mensagem
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
        IF NEW.tipo = 'receber' THEN
          notification_title := '💰 Pagamento Recebido';
          notification_body := 'Recebido: €' || COALESCE(NEW.valor::TEXT, '0');
        ELSE
          notification_title := '💸 Pagamento Efetuado';
          notification_body := 'Pago: €' || COALESCE(NEW.valor::TEXT, '0');
        END IF;
        notification_url := '/financeiro';
      ELSE
        RETURN NEW;
      END IF;
      
    ELSE
      RETURN NEW;
  END CASE;

  -- Construir payload
  payload := jsonb_build_object(
    'title', notification_title,
    'body', notification_body,
    'url', notification_url
  );

  -- Tentar enviar via pg_net
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
