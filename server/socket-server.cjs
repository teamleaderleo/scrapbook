const WebSocket = require('ws');
const { createServer } = require('http');

const server = createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
  const clientId = Date.now().toString();
  
  clients.set(clientId, {
    ws,
    connectionTime: Date.now(),
    lastActive: Date.now()
  });

  ws.send(JSON.stringify({ 
    type: 'connected', 
    clientId,
    serverTime: Date.now(),
    activeUsers: clients.size
  }));

  broadcastPresence();
  
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ 
        type: 'ping', 
        timestamp: Date.now() 
      }));
      
      const client = clients.get(clientId);
      if (client) {
        client.lastActive = Date.now();
      }
    }
  }, 30000);

  ws.on('close', () => {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
    clearInterval(pingInterval);
    broadcastPresence();
  });
});

function broadcastPresence() {
  const presenceData = {
    type: 'presence',
    activeUsers: clients.size,
    timestamp: Date.now()
  };

  clients.forEach(({ws}) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(presenceData));
    }
  });
}

server.listen(8080);