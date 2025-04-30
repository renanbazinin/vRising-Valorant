const BASE_URL = 'https://rigorous-cheerful-canidae.glitch.me';

// Status refresh function (already implemented)
async function refresh() {
  try {
    const resp = await fetch(`${BASE_URL}/status`);
    const data = await resp.json();

    document.getElementById('status-text').innerText = data.online ? 'Online' : 'Offline';
    document.getElementById('playerCount').innerText = data.players;

    const ind = document.getElementById('indicator');
    ind.classList.toggle('online', data.online);
    ind.classList.toggle('offline', !data.online);

  } catch (e) {
    console.error(e);
    document.getElementById('status-text').innerText = 'Error';
    document.getElementById('playerCount').innerText = '0';
    document.getElementById('indicator')
      .classList.remove('online')
      .classList.add('offline');
  }
}

// Get all players function
async function getPlayers(includeDisconnected = false) {
  try {
    const resp = await fetch(`${BASE_URL}/players?includeDisconnected=${includeDisconnected}`);
    const data = await resp.json();
    return data.players;
  } catch (e) {
    console.error('Error fetching players:', e);
    return [];
  }
}

// Get all clans function
async function getClans() {
  try {
    const resp = await fetch(`${BASE_URL}/clans`);
    const data = await resp.json();
    return data.clans;
  } catch (e) {
    console.error('Error fetching clans:', e);
    return [];
  }
}

// Execute custom command (use with caution!)
async function execCommand(cmd) {
  try {
    const resp = await fetch(`${BASE_URL}/exec/${encodeURIComponent(cmd)}`);
    const data = await resp.json();
    return data.result;
  } catch (e) {
    console.error('Error executing command:', e);
    throw e;
  }
}

// Get server uptime
async function getUptime() {
  try {
    const resp = await fetch(`${BASE_URL}/uptime`);
    const data = await resp.json();
    return data.uptime;
  } catch (e) {
    console.error('Error fetching uptime:', e);
    return 'Unavailable';
  }
}

// Get server info
async function getServerInfo() {
  try {
    const resp = await fetch(`${BASE_URL}/serverinfo`);
    const data = await resp.json();
    return data.info;
  } catch (e) {
    console.error('Error fetching server info:', e);
    return 'Unavailable';
  }
}

// Broadcast message to server
async function broadcastMessage(message) {
  try {
    const resp = await fetch(`${BASE_URL}/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    const data = await resp.json();
    return data;
  } catch (e) {
    console.error('Error broadcasting message:', e);
    throw e;
  }
}

// Update UI with full player list
async function showPlayerList() {
  // Check if player list container exists, if not create it
  let playerListContainer = document.getElementById('player-list-container');
  if (!playerListContainer) {
    const container = document.querySelector('.container');
    
    playerListContainer = document.createElement('div');
    playerListContainer.id = 'player-list-container';
    playerListContainer.className = 'list-container';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Online Players';
    
    const playerList = document.createElement('ul');
    playerList.id = 'player-list';
    
    playerListContainer.appendChild(heading);
    playerListContainer.appendChild(playerList);
    container.appendChild(playerListContainer);
  }
  
  const playerList = document.getElementById('player-list');
  const players = await getPlayers();
  
  playerList.innerHTML = '';
  if (players.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No players online';
    playerList.appendChild(li);
  } else {
    players.forEach(player => {
      const li = document.createElement('li');
      li.textContent = player;
      playerList.appendChild(li);
    });
  }
}

// Update UI with clan list
async function showClanList() {
  // Check if clan list container exists, if not create it
  let clanListContainer = document.getElementById('clan-list-container');
  if (!clanListContainer) {
    const container = document.querySelector('.container');
    
    clanListContainer = document.createElement('div');
    clanListContainer.id = 'clan-list-container';
    clanListContainer.className = 'list-container';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Clans';
    
    const clanList = document.createElement('ul');
    clanList.id = 'clan-list';
    
    clanListContainer.appendChild(heading);
    clanListContainer.appendChild(clanList);
    container.appendChild(clanListContainer);
  }
  
  const clanList = document.getElementById('clan-list');
  const clans = await getClans();
  
  clanList.innerHTML = '';
  if (clans.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No clans found';
    clanList.appendChild(li);
  } else {
    clans.forEach(clan => {
      const li = document.createElement('li');
      li.textContent = clan;
      clanList.appendChild(li);
    });
  }
}

// Update server info UI
async function updateServerInfo() {
  const serverInfoContent = document.getElementById('server-info-content');
  try {
    const info = await getServerInfo();
    serverInfoContent.textContent = info;
  } catch (e) {
    serverInfoContent.textContent = 'Failed to load server information';
  }
}

// Update uptime UI
async function updateUptime() {
  const uptimeContent = document.getElementById('uptime-content');
  try {
    const uptime = await getUptime();
    uptimeContent.textContent = uptime;
  } catch (e) {
    uptimeContent.textContent = 'Failed to load uptime';
  }
}

// Initialize and set up refresh intervals
function init() {
  // Add CSS for the new elements
  const style = document.createElement('style');
  style.textContent = `
    .list-container {
      margin-top: 1.5rem;
      text-align: left;
    }
    h2 {
      font-size: 1.1rem;
      color: #3b49df;
      margin-bottom: 0.5rem;
    }
    ul {
      list-style-position: inside;
      margin-bottom: 1rem;
    }
    li {
      padding: 0.2rem 0;
    }
    .container {
      width: 400px;
    }
    .server-info, .uptime, .broadcast-form {
      margin-top: 1.5rem;
      text-align: left;
    }
    #broadcast-form {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    #broadcast-message {
      flex-grow: 1;
      padding: 0.5rem;
    }
    #broadcast-status {
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }
    button {
      background-color: #3b49df;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    button:hover {
      background-color: #2a3bcc;
    }
  `;
  document.head.appendChild(style);

  // Set up broadcast form handler
  const broadcastForm = document.getElementById('broadcast-form');
  const broadcastStatus = document.getElementById('broadcast-status');
  
  broadcastForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('broadcast-message').value;
    broadcastStatus.textContent = 'Sending...';
    
    try {
      const result = await broadcastMessage(message);
      if (result.success) {
        broadcastStatus.textContent = 'Message sent successfully';
        document.getElementById('broadcast-message').value = '';
      } else {
        broadcastStatus.textContent = `Failed: ${result.error || 'Unknown error'}`;
      }
    } catch (e) {
      broadcastStatus.textContent = `Error: ${e.message}`;
    }
  });

  // Initial refresh
  refresh();
  showPlayerList();
  showClanList();
  updateServerInfo();
  updateUptime();
  
  // Set up intervals
  setInterval(refresh, 10000);         // Status every 10s
  setInterval(showPlayerList, 30000);  // Player list every 30s
  setInterval(showClanList, 60000);    // Clan list every 60s
  setInterval(updateServerInfo, 60000); // Server info every 60s
  setInterval(updateUptime, 30000);    // Uptime every 30s
}

// Start everything
init();