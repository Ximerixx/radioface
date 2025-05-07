const webpush = require('web-push');
const fs = require('fs');

const vapidKeys = webpush.generateVAPIDKeys();


const keys = {
    publicKey: vapidKeys.publicKey,
    privateKey: vapidKeys.privateKey
};

fs.writeFileSync('./keys.json', JSON.stringify(keys, null, 2));

console.log('VAPID keys generated and saved to keys.json');
