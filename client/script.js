let ws;
let pingStartTime = null;

function log(message) {
  const logDiv = document.getElementById('log');
  const entryDiv = document.createElement('div');
  entryDiv.className = 'log-entry animated';
  entryDiv.innerHTML = message;
  logDiv.appendChild(entryDiv);
  logDiv.scrollTop = logDiv.scrollHeight;
  
  // Batasi jumlah pesan yang ditampilkan
  const maxEntries = 50;
  while (logDiv.children.length > maxEntries) {
    logDiv.removeChild(logDiv.children[0]);
  }
}

function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connection-status');
  if (status === 'connected') {
    statusElement.className = 'badge bg-success';
    statusElement.innerText = 'Connected';
  } else {
    statusElement.className = 'badge bg-secondary';
    statusElement.innerText = 'Disconnected';
  }
}

function connect() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  if (!user || !pass) {
    log('<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> Username dan password wajib diisi</span>');
    return;
  }

  ws = new WebSocket(`ws://localhost:8080/?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);

  ws.onopen = () => {
    log('<span class="text-success"><i class="bi bi-check-circle"></i> Terhubung ke server.</span>');
    document.getElementById('controls').style.display = 'block';
    updateConnectionStatus('connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      let formatted = '';

      if (data.inventory) {
        const items = Object.entries(data.inventory);
        if (items.length === 0) {
          formatted = '<i class="bi bi-inbox"></i> <strong>Inventory:</strong> (kosong)';
        } else {
          formatted = '<i class="bi bi-list-ul"></i> <strong>Inventory:</strong><ul class="list-group mt-2">';
          items.forEach(([item, qty], index) => {
            formatted += `<li class="list-group-item d-flex justify-content-between align-items-center">
              ${item}
              <span class="badge bg-primary rounded-pill">${qty}</span>
            </li>`;
          });
          formatted += '</ul>';
        }
      } else if (data.success) {
        formatted = `<span class="text-success"><i class="bi bi-check-circle"></i> <strong>Sukses:</strong> ${data.success}</span>`;
      } else if (data.error) {
        formatted = `<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> <strong>Error:</strong> ${data.error}</span>`;
      } else if (data.notice) {
        formatted = `<span class="text-info"><i class="bi bi-info-circle"></i> <strong>Info:</strong> ${data.notice}</span>`;
      } else {
        formatted = Object.entries(data)
          .map(([key, value]) => `<strong>${key}:</strong> ${JSON.stringify(value)}`)
          .join('<br>');
      }

      if (data.message === 'pong' && pingStartTime !== null) {
        const latency = Date.now() - pingStartTime;
        formatted += `<div class="mt-2"><i class="bi bi-speedometer"></i> Waktu ping-pong: <span class="badge bg-secondary">${latency} ms</span></div>`;
        pingStartTime = null;
      }

      log(formatted);
    } catch (e) {
      log(`<span class="text-secondary">Diterima: ${event.data}</span>`);
    }
  };

  ws.onclose = () => {
    log('<span class="text-danger"><i class="bi bi-x-circle"></i> Terputus dari server.</span>');
    document.getElementById('controls').style.display = 'none';
    updateConnectionStatus('disconnected');
  };

  ws.onerror = (error) => {
    log(`<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> Error: ${error.message || error}</span>`);
    updateConnectionStatus('disconnected');
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