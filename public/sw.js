self.addEventListener('push', function (event) {
    try {
        const payload = event.data?.json();
        if (!payload || !payload.notification) {
            throw new Error('Invalid notification format');
        }

        const { title, body, icon, vibrate, badge } = payload.notification;

        const options = {
            body: body,
            icon: icon || 'assets/icons/icon-512x512.png',
            badge: badge || 'assets/icons/badge.png',
            vibrate: vibrate || [100, 50, 100],
            data: { url: payload.data?.url || 'https://radio.durka.su' },
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(title || 'Новое уведомление', options)
        );

    } catch (error) {
        console.error('Error handling push notification:', error);
        // Фолбек для некорректных уведомлений
        const fallbackOptions = {
            body: 'Получено новое уведомление',
            icon: 'assets/icons/icon-512x512.png',
            vibrate: [100, 50, 100]
        };
        event.waitUntil(
            self.registration.showNotification('Уведомление', fallbackOptions)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data?.url || 'https://radio.durka.su';
    event.waitUntil(
        clients.openWindow(url)
    );
});