document.addEventListener('DOMContentLoaded', async () => {
    const button = document.getElementById('enablePush');

    // Проверка поддержки
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push не поддерживается');
        button.style.display = 'none';
        return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker зарегистрирован:', registration);

    // Проверка текущей подписки
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        console.log('Уже подписан:', subscription);
        // button.style.display = 'none'; // Скрыть кнопку, если подписан
        buttonUpdate();
        return;
    }

    // Получение VAPID ключа
    const response = await fetch('/vapidPublicKey');
    const data = await response.json();
    const publicKey = urlBase64ToUint8Array(data.publicKey);

    // Обработчик клика по кнопке
    button.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Разрешение отклонено');
            return;
        }

        try {
            const newSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey
            });

            console.log('Подписка успешна:', newSubscription);

            await fetch('/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSubscription)
            });

            //button.style.display = 'none'; // Скрыть кнопку после подписки
            buttonUpdate();
        } catch (err) {
            console.error('Ошибка подписки:', err);
        }
    });
});
async function buttonUpdate() {
    const button = document.getElementById('enablePush');
    button.textContent = 'Вы уже подписались — спасибо!';
    button.style.backgroundColor = '#4CAF50'; // Зеленый
    button.style.color = 'white';
    button.disabled = true;
}
// Функция для преобразования base64 -> Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}
