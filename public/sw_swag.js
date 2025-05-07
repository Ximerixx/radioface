self.addEventListener('push', function (event) {
    let options = {
        body: event.data.text(),  // Получаем тело уведомления
        icon: 'assets/icons/icon-192x192.png',  // Путь к иконке уведомления
        badge: 'assets/icons/badge.png',  // Путь к бейджу
        vibrate: [100, 50, 100],
    };

    // Отправка уведомления
    event.waitUntil(
        self.registration.showNotification('Новое уведомление', options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://radio.durka.su')
    );
});
