const fs = require('fs');
const path = require('path');
let isStreamOnline = false;
const fetch = require('node-fetch');

const secretConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'secret.json')));
const SECRET_KEY = secretConfig.secretKey;

async function checkStream() {
    try {
        const response = await fetch('https://static.radio.durka.su/stream.mp3', {
            method: 'HEAD'
        });
        const isOnline = response.ok;

        if (isOnline && !isStreamOnline) {
            await sendNotification();
            isStreamOnline = true;
        } else if (!isOnline && isStreamOnline) {
            isStreamOnline = false;
        }

    } catch (error) {
        console.error('Error checking stream:', error);
        if (isStreamOnline) isStreamOnline = false;
    }
}

async function sendNotification() {
    const response = await fetch('https://radio.durka.su/sendNotification', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${SECRET_KEY}`
        },
        body: JSON.stringify({
            title: "Началась трансляция, прямо из чайки!!!",
            body: "Нажми на меня, и ты сможешь послушать что мы сейчас здесь делаем!"
        })
    });

    if (!response.ok) {
        console.error('Error sending message:', await response.text());
    }
}

module.exports = { checkStream };