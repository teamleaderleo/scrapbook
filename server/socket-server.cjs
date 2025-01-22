const WebSocket = require('ws');
const { createServer } = require('http');

const server = createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client has been connected');

  // Confirmation
  ws.send(JSON.stringify({ type: 'status', data: 'connected' }));
  
  // Ping client every 30 seconds to keep connection
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('close', () => {
    console.log('Client has disconnected');
    clearInterval(pingInterval);
  });

  ws.on('pong', () => {
    // Client responded to ping
    ws.send(JSON.stringify({ type: 'latency', data: Date.now() }));
  });
});

server.listen(8080);