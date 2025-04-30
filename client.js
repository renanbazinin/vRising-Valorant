// public/client.js
const BASE = "https://rigorous-cheerful-canidae.glitch.me";
// Refresh status (players) every 10s
async function refresh() {
  const { online, players } = await fetch(`${BASE}/status`).then(r=>r.json());
  document.getElementById('status-text').innerText = online ? 'Online' : 'Offline';
  document.getElementById('playerCount').innerText  = players;
  document.getElementById('indicator').classList.toggle('online', online);
}

// Broadcast form
async function doBroadcast(e) {
  e.preventDefault();
  const msg = document.getElementById('broadcast-message').value;
  document.getElementById('broadcast-status').innerText = 'Sending…';
  const { success } = await fetch(`${BASE}/broadcast`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ message: msg })
  }).then(r=>r.json());
  document.getElementById('broadcast-status').innerText =
    success ? 'Sent!' : 'Failed';
  if (success) document.getElementById('broadcast-message').value = '';
}

window.addEventListener('DOMContentLoaded', () => {
  // initial load
  refresh();
  // set up broadcast
  document.getElementById('broadcast-form').addEventListener('submit', doBroadcast);
  // intervals
  setInterval(refresh, 10000);
});