/**
 * Web Push Notifications Hook
 * Gerencia permissões e subscriptions para notificações push
 *
 * NOTA: A tabela push_subscriptions precisa ser criada no Supabase primeiro.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Converter base64 URL-safe para Uint8Array (necessário para Web Push)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | "default";
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: "default",
  });

  // Registrar Service Worker específico para Push
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw-push.js")
        .then((registration) => {
          logger.info("[Push] Service Worker registrado:", registration.scope);
        })
        .catch((error) => {
          logger.error("[Push] Erro ao registrar Service Worker:", error);
        });
    }
  }, []);

  // Verificar suporte e estado atual
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = "serviceWorker" in navigator && "PushManager" in window;

      if (!isSupported) {
        setState((prev) => ({ ...prev, isSupported: false, isLoading: false }));
        return;
      }

      const permission = Notification.permission;

      // Verificar se já tem subscription ativa
      let isSubscribed = false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        isSubscribed = !!subscription;
      } catch {
        // Erro ao verificar subscription
      }

      setState({
        isSupported: true,
        isSubscribed,
        isLoading: false,
        permission,
      });
    };

    checkSupport();
  }, []);

  // Solicitar permissão e criar subscription
  const subscribe = useCallback(async () => {
    if (!user) {
      toast.error("Faça login para ativar notificações");
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      logger.error("VAPID_PUBLIC_KEY não configurada");
      toast.error("Configuração de notificações incompleta");
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // 1. Solicitar permissão
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        toast.error("Permissão de notificações negada");
        setState((prev) => ({ ...prev, isLoading: false, permission }));
        return false;
      }

      // 2. Aguardar Service Worker estar pronto
      const registration = await navigator.serviceWorker.ready;

      // 3. Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // 4. Salvar no Supabase usando API REST direta
      const subscriptionJSON = subscription.toJSON();

      // Usar a API do Supabase diretamente para tabela não tipada
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/push_subscriptions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            user_id: user.id,
            endpoint: subscriptionJSON.endpoint,
            keys: {
              p256dh: subscriptionJSON.keys?.p256dh,
              auth: subscriptionJSON.keys?.auth,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("Erro ao salvar subscription:", errorData);
        throw new Error("Falha ao salvar subscription");
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        permission: "granted",
      }));

      toast.success("Notificações ativadas com sucesso!");
      return true;
    } catch (error) {
      logger.error("Erro ao ativar notificações:", error);
      toast.error("Erro ao ativar notificações");
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user]);

  // Cancelar subscription
  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remover do Supabase usando API REST direta
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/push_subscriptions?user_id=eq.${user.id}&endpoint=eq.${encodeURIComponent(subscription.endpoint)}`,
          {
            method: "DELETE",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
          }
        );
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast.success("Notificações desativadas");
      return true;
    } catch (error) {
      logger.error("Erro ao desativar notificações:", error);
      toast.error("Erro ao desativar notificações");
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
