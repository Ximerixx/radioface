const fs = require('fs');
const path = require('path');
const https = require('https');
const { error } = require('console');

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
    try {
        const response = await fetch(STREAM_URL, { method: 'GET' });

        if (response.ok) {
            if (!isStreamOnline) {
                console.log('Stream is online now — sending notifications...');
                await sendNotification();
                isStreamOnline = true;
            } else {
                console.log('Stream is still online. No action needed.');
            }
        } else {
            // Ответ от сервера есть, но не 200 (например, 404)
            if (isStreamOnline) {
                console.log('Stream just went offline (status !== 200).');
                isStreamOnline = false;
            }
        }

    } catch (error) {
        if (isStreamOnline) {
            console.log('Stream just went offline (fetch error).');
            isStreamOnline = false;
        }
        console.error('Error while checking stream:', error);
    }
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