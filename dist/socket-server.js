"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var http_1 = require("http");
var server = (0, http_1.createServer)();
var wss = new ws_1.WebSocketServer({ server: server });
wss.on('connection', function (ws) {
    console.log('Client has been connected');
    // Confirmation
    ws.send(JSON.stringify({ type: 'status', data: 'connected' }));
    // Ping client every 30 seconds to keep connection
    var pingInterval = setInterval(function () {
        if (ws.readyState === ws_1.default.OPEN) {
            ws.ping();
        }
    }, 30000);
    ws.on('close', function () {
        console.log('Client has disconnected');
        clearInterval(pingInterval);
    });
    ws.on('pong', function () {
        // Client responded to ping
        ws.send(JSON.stringify({ type: 'latency', data: Date.now() }));
    });
});
server.listen(8080);
