// public/client.js
const BASE = "https://rigorous-cheerful-canidae.glitch.me";
// Refresh status (players) every 10s
async function refresh() {
  const { online, players } = await fetch(`${BASE}/status`).then(r=>r.json());
  document.getElementById('status-text').innerText = online ? 'Online' : 'Offline';
  document.getElementById('playerCount').innerText  = players;
  document.getElementById('indicator').classList.toggle('online', online);

  // record last update & next fetch times
  const now  = new Date();
  const next = new Date(now.getTime() + 10000);
  document.getElementById('last-update').innerText = now.toLocaleTimeString();
  document.getElementById('next-fetch').innerText  = next.toLocaleTimeString();
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

// public/client.js
async function loadInfo() {
  const info = await fetch(`${BASE}/info`).then(r=>r.json());
  document.getElementById('uptime-content').innerText   = `${info.uptime}s`;
  document.getElementById('day-content').innerText      = `Day ${info.day}`;
  document.getElementById('fps-content').innerText      = `${info.fps} FPS`;
  document.getElementById('worldTime-content').innerText = 
    info.worldTime != null ? `${info.worldTime}s` : '–';

  // new clan count field
  document.getElementById('clanCount-content').innerText =
    info.clanCount != null ? info.clanCount : '–';
}

// add Save and Shutdown handlers
async function doSave() {
  await fetch(`${BASE}/save`, { method: 'POST' });
}
async function doShutdown() {
  await fetch(`${BASE}/shutdown`, { method: 'POST' });
}

window.addEventListener('DOMContentLoaded', () => {
  refresh();
  loadInfo();                             // initial info load
  document.getElementById('broadcast-form')
    .addEventListener('submit', doBroadcast);
  setInterval(refresh, 10000);
  setInterval(loadInfo, 10000);           // periodic info refresh
  document.getElementById('save-btn')
    .addEventListener('click', doSave);
  document.getElementById('shutdown-btn')
    .addEventListener('click', doShutdown);
});