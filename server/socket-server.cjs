const WebSocket = require('ws');
const { createServer } = require('http');

const server = createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected, sending initial message');
  ws.send(JSON.stringify({ 
    type: 'connected', 
    serverTime: Date.now() 
  }));
  
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // console.log('Sending ping message');
      ws.send(JSON.stringify({ 
        type: 'ping', 
        timestamp: Date.now() 
      }));
    }
  }, 5000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(pingInterval);
  });
});

server.listen(8080);