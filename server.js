const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const webpush = require('web-push');

const { checkStream } = require('./checker.js');

const app = express();
const PORT = process.env.PORT || 8080;
const vapidKeys = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'keys.json')));

const isVerbose = process.argv.includes('-v');

const secretConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'secret.json')));
const SECRET_KEY = secretConfig.secretKey;


app.set('trust proxy', true);



const subscriptionsFilePath = path.resolve(__dirname, 'subscriptions.json');


let subscriptions = [];
if (fs.existsSync(subscriptionsFilePath)) {
    const fileData = fs.readFileSync(subscriptionsFilePath, 'utf-8');
    try {
        subscriptions = JSON.parse(fileData);
    } catch (err) {
        console.error('Error checking subscription.json:', err);
    }
}




if (isVerbose) {
    app.use((req, res, next) => {
        console.log(`Got request: ${req.method} ${req.url}`);
        next();
    });
}

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).type('text/plain').send('Error reading index.html');
        } else {
            res.type('html').send(data);
        }
    });
});

webpush.setVapidDetails(
    'mailto:admin@durka.su',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

app.use(express.json());

// Маршрут для подписки
app.post('/subscribe', (req, res) => {
    const subscription = req.body;

    if (!subscription) {
        return res.status(400).json({ error: 'No subscription data provided' });
    }

    subscriptions.push(subscription);


    if (isVerbose) { console.log('Текущие подписки:', subscriptions); }

    try {
        fs.writeFileSync(subscriptionsFilePath, JSON.stringify(subscriptions, null, 2), 'utf-8');
        if (isVerbose) { console.log('Saved Subscriptions successfully '); }
        res.status(201).json({});
    } catch (err) {
        console.error('Failed to write to subscriptions.json:', err);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

app.get('/vapidPublicKey', (req, res) => {
    res.json({
        publicKey: vapidKeys.publicKey
    });
});

// Маршрут для отправки уведомлений с авторизацией
app.post('/sendNotification', (req, res) => {

    const authHeader = req.headers['authorization'];
    const realIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!authHeader || authHeader !== `Bearer ${SECRET_KEY}`) {
        console.log(`${realIp} tried: ${authHeader}, needed:`, `Bearer ${SECRET_KEY}`)
        return res.status(403).json({ error: 'Forbidden: Invalid or missing authorization' });

    }

    const { title, body } = req.body;


    if (!title || !body) {
        console.log('Title and body are required', `got ${req.body}`)
        return res.status(400).json({ error: 'Title and body are required' });
    }

    const notificationPayload = {
        notification: {
            title: title,
            body: body,
            icon: 'assets/icons/icon-512x512.png',
            vibrate: [100, 50, 100],
            badge: 'assets/icons/badge.png',
        }
    };

    Promise.all(subscriptions.map(sub =>
        webpush.sendNotification(sub, JSON.stringify(notificationPayload))
    ))
        .then(() => {
            res.status(200).json({ message: 'Notification sent successfully' });
            console.log(notificationPayload);
        })
        .catch(err => {
            console.error(err);
            console.log(notificationPayload);
            res.status(500).json({ error: `Failed to send notification` });
        });
});


const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

// Обработка WebSocket подключений
wss.on('connection', (ws, req) => {
    const realIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('New client: ', realIp);
    clients.push(ws);
    ws.send(JSON.stringify({ message: 'Подключение к чату успешно.' }));

    ws.on('message', (message) => {
        console.log(`IP: `, realIp, `Received: ${message}`);

        // Отправка сообщения всем подключённым клиентам
        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: `${message}` }));
            }
        }
    });

    // Обработка отключения клиента
    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});


/////чекер
setInterval(checkStream, 30000);



app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res) => {
    res.status(404).type('text/plain').send('Not Found');
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} VAPID: ${vapidKeys.publicKey}`);
});
