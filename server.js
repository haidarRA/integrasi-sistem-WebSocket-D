const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const url = require('url');

const server = https.createServer({
  cert: fs.readFileSync('cert.pem'),
  key: fs.readFileSync('key.pem')
});

const MAX_CONNECTIONS = 5;
const validUsers = {
  'admin': 'password123',
};

const inventory = {};
const clients = new Set();

const wss = new WebSocket.Server({ server });

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws, req) => {
  const { query } = url.parse(req.url, true);
  const user = query.user;
  const pass = query.pass;  

  if (!validUsers[user] || validUsers[user] !== pass || clients.size >= MAX_CONNECTIONS) {
    ws.close(1008, 'Unauthorized or server full');
    return;
  }

  ws.isAlive = true;
  ws.on('pong', heartbeat);

  clients.add(ws);

  ws.send(JSON.stringify({
    message: `Welcome, ${user}!`
  }));

  ws.on('message', (message) => {
    try {
      const req = JSON.parse(message);
      let response = {};

      switch (req.action) {
        case 'add':
          if (!req.item || !req.quantity) {
            response = { error: 'Missing item or quantity' };
          } else {
            inventory[req.item] = (inventory[req.item] || 0) + req.quantity;
            response = { success: `Added ${req.quantity} of ${req.item}` };
            broadcast({ notice: `${req.quantity} of ${req.item} added` });
          }
          break;

        case 'get':
          response = { inventory };
          break;

        /*
        case 'obtain':
          if (!inventory[req.item]) {
            response = { error: `${req.item} does not exist or is out of stock` };
          } else {
            inventory[req.item]--;
            if (inventory[req.item] === 0) delete inventory[req.item];
            response = { success: `Obtained 1 ${req.item}` };
          }
          break;
        */

        case 'obtain':
          if (!inventory[req.item] || !req.item || !req.quantity) {
            response = { error: `${req.item} does not exist or is out of stock` };
          } else {
            inventory[req.item] = (inventory[req.item] || 0) - req.quantity;
            if (inventory[req.item] === 0) delete inventory[req.item];
            response = { success: `Obtained ${req.quantity} of ${req.item}` };
          }
          break;

        case 'delete':
          if (inventory[req.item]) {
            delete inventory[req.item];
            response = { success: `Deleted ${req.item}` };
            broadcast({ notice: `${req.item} was deleted from inventory` });
          } else {
            response = { error: `${req.item} not found` };
          }
          break;

        case 'ping':
          response = { message: 'pong' };
          break;
          
        default:
          response = { error: 'Unknown action' };
      }

      ws.send(JSON.stringify(response));
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => clients.delete(ws));
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

server.listen(8080, () => {
  console.log('Secure WebSocket server running on wss://localhost:8080');
});
