let ws;
let pingStartTime = null;

function log(message) {
  const logDiv = document.getElementById('log');
  logDiv.innerHTML = `<div>${message}</div>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}

function connect() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  ws = new WebSocket(`wss://localhost:8080/?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);

  ws.onopen = () => {
    log('Connected to server.');
    document.getElementById('controls').style.display = 'block';
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      let formatted = '';

      if (data.inventory) {
        const items = Object.entries(data.inventory);
        if (items.length === 0) {
          formatted = 'inventory: (empty)';
        } else {
          formatted = 'inventory:<br>' + items.map(([item, qty], index) => `${index + 1}. ${item}: ${qty}`).join('<br>');
        }
      } else {
        formatted = Object.entries(data)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('<br>');
      }

      if (data.message === 'pong' && pingStartTime !== null) {
        const latency = Date.now() - pingStartTime;
        formatted += `<br>ping-pong time: ${latency} ms`;
        pingStartTime = null;
      }

      log(formatted);
    } catch (e) {
      log(`Received: ${event.data}`);
    }
  };

  ws.onclose = () => {
    log('Disconnected from server.');
    document.getElementById('controls').style.display = 'none';
  };

  ws.onerror = (error) => {
    log(`Error: ${error.message || error}`);
  };
}

function sendAdd() {
  const item = document.getElementById('item').value;
  const quantity = parseInt(document.getElementById('quantity').value, 10);
  if (!item || isNaN(quantity)) {
    log('Please enter valid item and quantity.');
    return;
  }
  ws.send(JSON.stringify({ action: 'add', item, quantity }));
}

function sendObtain() {
  const item = document.getElementById('item').value;
  const quantity = parseInt(document.getElementById('quantity').value, 10);
  if (!item || isNaN(quantity)) {
    log('Please enter valid item and quantity.');
    return;
  }
  ws.send(JSON.stringify({ action: 'obtain', item, quantity }));
}

function sendDelete() {
  const item = document.getElementById('item').value;
  if (!item) {
    log('Please enter item name.');
    return;
  }
  ws.send(JSON.stringify({ action: 'delete', item }));
}

function sendGet() {
  ws.send(JSON.stringify({ action: 'get' }));
}

function sendPing() {
  pingStartTime = Date.now();
  ws.send(JSON.stringify({ action: 'ping' }));
}