const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Создание HTTP сервера
const server = http.createServer((req, res) => {
    // Обслуживание статики (например, HTML страницы)
    if (req.url === '/' && req.method === 'GET') {
        // Отправка HTML страницы клиенту
        //fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
        fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, data) => {

            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error reading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        // Обработка других запросов (например, 404)
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Создание WebSocket сервера, используя тот же HTTP сервер
const wss = new WebSocket.Server({ server });

// Массив для хранения всех подключённых клиентов
let clients = [];




// Обработка получения сообщений от клиентов
wss.on('connection', (ws, req) => {
    const realIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('New client: ', realIp);
    //console.log('Client IP:', req.connection.remoteAddress);
    clients.push(ws);
    ws.send(JSON.stringify({ message: 'Подключение к чату успешно.' }));

    ws.on('message', (message) => {
        console.log(`IP: `, req.connection.remoteAddress, `Received: ${message}`);

        // Отправка полученного сообщения всем подключённым клиентам



        //wss.clients.forEach((client) => {

        for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ message: `${message}` })
                );      ////client !== ws &&
            }

        };



    });

    // Обработка отключения клиента
    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
    //clients.forEach((client) => {
    //    if (client !== ws && client.readyState === WebSocket.OPEN) {
    //        client.send(message);
    //    }
    //})
});

// Запуск сервера на порту 8080
server.listen(8080, '0.0.0.0', () => {
    console.log(`Server is listening `);
});
