/**
 * NotificationToggle Component
 * Toggle para ativar/desativar notificações push com menu de opções
 */
import { Bell, BellOff, Loader2, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PushNotifications } from '@/lib/push-notifications';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function NotificationToggle() {
    const { user } = useAuth();
    const isHam = user?.email?.toLowerCase() === 'ham@admin.com';
    const lang: 'pt' | 'fr' = isHam ? 'fr' : 'pt';

    const t = (k: string) => {
        const d: Record<string, { pt: string, fr: string }> = {
            'Carregando...': { pt: 'Carregando...', fr: 'Chargement...' },
            'Notificações bloqueadas pelo navegador': { pt: 'Notificações bloqueadas pelo navegador', fr: 'Notifications bloquées par le navigateur' },
            'Notificações ativas': { pt: 'Notificações ativas', fr: 'Notifications actives' },
            'Ativar notificações': { pt: 'Ativar notificações', fr: 'Activer les notifications' },
            'Enviando notificação de teste...': { pt: 'Enviando notificação de teste...', fr: 'Envoi d\'une notification de test...' },
            'Notificação enviada!': { pt: 'Notificação enviada!', fr: 'Notification envoyée !' },
            'Erro ao enviar: ': { pt: 'Erro ao enviar: ', fr: 'Erreur lors de l\'envoi : ' },
            'Testar Notificação': { pt: 'Testar Notificação', fr: 'Tester la notification' },
            'Desativar': { pt: 'Desativar', fr: 'Désactiver' }
        };
        return d[k]?.[lang] || k;
    };

    const {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        subscribe,
        unsubscribe,
    } = usePushNotifications();

    // Não renderizar se não for suportado
    if (!isSupported) {
        return null;
    }

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    const handleTestNotification = async () => {
        toast.loading('Enviando notificação de teste...');
        const result = await PushNotifications.teste();
        if (result.success) {
            toast.success('Notificação enviada!');
        } else {
            toast.error('Erro ao enviar: ' + result.error);
        }
    };

    const getTooltipText = () => {
        if (isLoading) return 'Carregando...';
        if (permission === 'denied') return 'Notificações bloqueadas pelo navegador';
        if (isSubscribed) return 'Notificações ativas';
        return 'Ativar notificações';
    };

    // Se não está subscribed, mostrar apenas o botão simples
    if (!isSubscribed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggle}
                        disabled={isLoading || permission === 'denied'}
                        className={cn(
                            "h-9 w-9 rounded-full transition-colors",
                            permission === 'denied' && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <BellOff className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{getTooltipText()}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    // Se subscribed, mostrar dropdown com opções
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={isLoading}
                    className={cn(
                        "h-9 w-9 rounded-full transition-colors",
                        "text-primary bg-primary/10 hover:bg-primary/20"
                    )}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Bell className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleTestNotification}>
                    <BellRing className="h-4 w-4 mr-2" />
                    Testar Notificação
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleToggle}
                    className="text-destructive focus:text-destructive"
                >
                    <BellOff className="h-4 w-4 mr-2" />
                    Desativar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
