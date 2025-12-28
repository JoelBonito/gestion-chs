/**
 * Utilitário para enviar notificações push via Edge Function
 */
import { supabase } from '@/integrations/supabase/client';

interface PushNotificationPayload {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    user_id?: string;
}

/**
 * Envia uma notificação push para todos os usuários ou um específico
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<{
    success: boolean;
    sent?: number;
    error?: string;
}> {
    try {
        const { data, error } = await supabase.functions.invoke('send-push-notification', {
            body: payload,
        });

        if (error) {
            console.error('Erro ao enviar push:', error);
            return { success: false, error: error.message };
        }

        return { success: true, sent: data?.sent || 0 };
    } catch (err) {
        console.error('Erro ao chamar Edge Function:', err);
        return { success: false, error: String(err) };
    }
}

/**
 * Notificações pré-definidas para eventos comuns
 */
export const PushNotifications = {
    novaEncomenda: (numero: string) => sendPushNotification({
        title: '📦 Nova Encomenda',
        body: `Encomenda #${numero} criada`,
        url: '/encomendas',
        tag: 'nova-encomenda',
    }),

    statusAlterado: (numero: string, novoStatus: string) => sendPushNotification({
        title: '🔄 Status Atualizado',
        body: `Encomenda #${numero} → ${novoStatus}`,
        url: '/encomendas',
        tag: 'status-encomenda',
    }),

    pagamentoRecebido: (valor: number, cliente?: string) => sendPushNotification({
        title: '💰 Pagamento Recebido',
        body: cliente
            ? `Recebido €${valor.toFixed(2)} de ${cliente}`
            : `Recebido €${valor.toFixed(2)}`,
        url: '/financeiro',
        tag: 'pagamento-recebido',
    }),

    pagamentoEfetuado: (valor: number, fornecedor?: string) => sendPushNotification({
        title: '💸 Pagamento Efetuado',
        body: fornecedor
            ? `Pago €${valor.toFixed(2)} para ${fornecedor}`
            : `Pago €${valor.toFixed(2)}`,
        url: '/financeiro',
        tag: 'pagamento-efetuado',
    }),

    teste: () => sendPushNotification({
        title: '🔔 Teste de Notificação',
        body: 'Se você está vendo isso, as notificações funcionam!',
        url: '/dashboard',
        tag: 'teste',
    }),
};
