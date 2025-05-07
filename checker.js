const fs = require('fs');
const path = require('path');
const https = require('https');

// Универсальная инициализация fetch
let fetch;
if (typeof globalThis.fetch !== 'function') {
    fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
} else {
    fetch = globalThis.fetch;
}

let isStreamOnline = false;
const STREAM_URL = 'https://static.radio.durka.su/stream.mp3';

const secretConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'secret.json')));
const SECRET_KEY = secretConfig.secretKey;


async function checkStream() {
    fetch(STREAM_URL, { method: 'GET' })
        .then(response => {
            if (response.ok) {
                if (!isStreamOnline) {
                    console.log('stream online, sending notification request...');
                    sendNotification();
                    console.log("Done.");
                    isStreamOnline = true;
                } else {
                    if (isStreamOnline) {
                        console.log('Stream is offline.');
                        isStreamOnline = false;
                    }
                }
                console.log('Stream status didnt changed.');
                console.log(`stream thoughts ${isStreamOnline}`)
            }
        })
        .catch(error => {
            // Если возникла ошибка при попытке получения файла
            //document.getElementById('playButton').style.display = 'none';
            console.log('Checking caused an error:', error);
        });

}


async function sendNotification() {
    try {
        console.log('Request started');
        const response = await fetch('https://radio.durka.su/sendNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SECRET_KEY}`
            },
            body: JSON.stringify({
                title: "Началась трансляция, прямо из чайки!!!",
                body: "Нажми на меня, и ты сможешь послушать что мы сейчас здесь делаем!"
            })
        });

        if (!response.ok) {
            console.error('Error posting ->:', await response.text());
        } else {
            console.log('Request finished with OK on checker side');
        }
    } catch (error) {
        console.error('Error posting a request', error);
    }
}

module.exports = { checkStream };