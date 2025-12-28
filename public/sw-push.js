/**
 * Service Worker para Web Push Notifications
 * Gestion CHS
 */

// Evento de instalação
self.addEventListener('install', function (event) {
    console.log('[SW] Service Worker installed');
    self.skipWaiting();
});

// Evento de ativação
self.addEventListener('activate', function (event) {
    console.log('[SW] Service Worker activated');
    event.waitUntil(self.clients.claim());
});

// Evento de push notification
self.addEventListener('push', function (event) {
    console.log('[SW] Push received:', event);

    var data = {
        title: 'Gestion CHS',
        body: 'Você tem uma nova notificação',
        icon: '/logo-inove.jpg',
        badge: '/logo-inove.jpg',
        tag: 'gestion-chs-notification',
        data: { url: '/' }
    };

    // Tentar parsear dados do push
    if (event.data) {
        try {
            var pushData = event.data.json();
            data = Object.assign({}, data, pushData);
        } catch (e) {
            // Usar dados padrão se não conseguir parsear
            data.body = event.data.text();
        }
    }

    var options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        tag: data.tag,
        data: data.data,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        actions: [
            { action: 'open', title: 'Ver Detalhes' },
            { action: 'close', title: 'Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Evento de clique na notificação
self.addEventListener('notificationclick', function (event) {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    var urlToOpen = (event.notification.data && event.notification.data.url) || '/';

    // Abrir ou focar na janela existente
    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then(function (clientList) {
                // Procurar janela existente
                for (var i = 0; i < clientList.length; i++) {
                    var client = clientList[i];
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Abrir nova janela se não encontrar
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// Evento de fechamento da notificação
self.addEventListener('notificationclose', function (event) {
    console.log('[SW] Notification closed:', event);
});
