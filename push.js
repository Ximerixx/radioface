const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const keysPath = path.join(__dirname, 'push.json');
const vapidKeys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));

webpush.setVapidDetails(
    'mailto:example@yourdomain.org',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

function sendNotification(subscription, payload) {
    return webpush.sendNotification(subscription, JSON.stringify(payload));
}

module.exports = {
    sendNotification,
    publicKey: vapidKeys.publicKey
};
