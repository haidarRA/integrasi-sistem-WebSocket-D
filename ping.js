const WebSocket = require('ws');

const ws = new WebSocket('wss://localhost:8080/?user=admin&pass=password123', {
  rejectUnauthorized: false
});

ws.on('open', () => {
  console.log('Connected to server');

  setInterval(() => {
    console.log('ping (to server)');
    ws.ping();
  }, 1800);
});

ws.on('pong', () => {
  console.log('pong (from server)');
});

ws.on('close', () => {
  console.log('Disconnected from server');
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
