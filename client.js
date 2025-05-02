// public/client.js
const BASE = "https://rigorous-cheerful-canidae.glitch.me";
const FETCH_TIMEOUT = 10000; // 10 seconds

// --- Helper Functions ---

/**
 * Fetches a resource with a specified timeout.
 * @param {string} url The URL to fetch.
 * @param {object} options Fetch options.
 * @param {number} timeout Timeout duration in milliseconds.
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Updates the text content and CSS classes of an element to reflect state.
 * @param {string} elementId The ID of the HTML element.
 * @param {'loading' | 'error' | 'success'} state The state to set.
 * @param {string} [message] The message to display (optional, defaults based on state).
 */
function setElementState(elementId, state, message = '') {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.remove('loading', 'error'); // Clear previous states

  switch (state) {
    case 'loading':
      element.classList.add('loading');
      element.innerText = message || 'Loading...';
      break;
    case 'error':
      element.classList.add('error');
      element.innerText = message || 'Failed';
      break;
    case 'success':
      element.innerText = message; // Set the final content
      break;
    default:
      element.innerText = message; // Default case just sets text
  }
}

/**
 * Formats a number with commas as thousands separators
 * @param {number} num - The number to format
 * @returns {string} - The formatted number
 */
function formatNumber(num) {
  if (num === undefined || num === null) return '–';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format bytes to a human-readable format
 * @param {number} bytes - The bytes value
 * @returns {string} - Formatted string (KB/MB/GB)
 */
function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return '–';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === 0) return bytes + ' B';
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Format seconds to a human-readable time format
 * @param {number} seconds - Total seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
  if (seconds === undefined || seconds === null) return '–';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  } else {
    return `${mins}m ${secs}s`;
  }
}

// --- Core Functions ---

// Refresh status (players) every 10s - now works with updated API response
async function refresh() {
  const statusTextEl = 'status-text';
  const playerCountEl = 'playerCount';
  const indicatorEl = 'indicator';

  setElementState(statusTextEl, 'loading');
  setElementState(playerCountEl, 'loading', '...');
  document.getElementById(indicatorEl)?.classList.remove('online', 'offline'); // Reset indicator visually

  try {
    const response = await fetchWithTimeout(`${BASE}/status`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    setElementState(statusTextEl, 'success', data.online ? 'Online' : 'Offline');
    setElementState(playerCountEl, 'success', data.players);
    document.getElementById(indicatorEl)?.classList.add(data.online ? 'online' : 'offline');
    
    // Also update some quick stats from the status endpoint
    if (data.uptime) setElementState('uptime-content', 'success', formatTime(data.uptime));
    if (data.day) setElementState('day-content', 'success', data.day);
    if (data.fps) setElementState('fps-content', 'success', data.fps.toFixed(1));
  } catch (error) {
    console.error("Refresh error:", error);
    setElementState(statusTextEl, 'error', 'Failed');
    setElementState(playerCountEl, 'error', '!');
    document.getElementById(indicatorEl)?.classList.add('offline'); // Default to offline on error
  } finally {
    // Update timestamps regardless of success/failure
    const now = new Date();
    const next = new Date(now.getTime() + 10000);
    document.getElementById('last-update').innerText = now.toLocaleTimeString();
    document.getElementById('next-fetch').innerText = next.toLocaleTimeString();
  }
}

// Load server info with all the new metrics - updated for new nested structure
async function loadInfo() {
  // Define all metric IDs for batch updating
  const metricElements = [
    'uptime-content', 'day-content', 'fps-content', 'worldTime-content', 'clanCount-content',
    'version-content', 'maxPlayers', 'frame-time-content', 'reset-days-content',
    'net-ids-content', 'bytes-sent-content', 'bytes-recv-content', 'msgs-sent-content', 'pkts-recv-content',
    'logs-debug-content', 'logs-warning-content', 'logs-error-content', 'logs-exception-content',
    'ai-paths-content', 'ecs-archetypes-content', 'worker-threads-content',
    'modifiables-active-content', 'modifiables-changes-content',
    'ai-enabled-content', 'ai-paths-failed-content', 'server-type-content',
    'ecs-active-content', 'threads-max-content', 'build-timestamp-content', 'players-taken-content'
  ];
  
  // Set all elements to loading state
  metricElements.forEach(id => setElementState(id, 'loading'));

  try {
    const response = await fetchWithTimeout(`${BASE}/info`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const info = await response.json();
    
    // Version information
    const version = info.version;
    setElementState('version-content', 'success', 
      `${version.major}.${version.minor}.${version.patch} (${version.network}.${version.build})`);
    
    // Server information
    if (document.getElementById('server-type-content')) {
      const serverType = info.server.dedicated ? "Dedicated" : "Local";
      setElementState('server-type-content', 'success', serverType);
    }
    
    // Build timestamp
    if (document.getElementById('build-timestamp-content') && info.buildTimestamp) {
      const date = new Date(info.buildTimestamp * 1000);
      setElementState('build-timestamp-content', 'success', date.toLocaleDateString());
    }
    
    // Players & Clans
    setElementState('playerCount', 'success', info.players.connected);
    setElementState('maxPlayers', 'success', info.players.maxAllowed);
    if (document.getElementById('players-taken-content')) {
      setElementState('players-taken-content', 'success', info.players.taken);
    }
    setElementState('clanCount-content', 'success', info.clans.count);
    
    // World information
    setElementState('uptime-content', 'success', formatTime(info.world.uptimeSec));
    setElementState('day-content', 'success', info.world.inGameDay);
    setElementState('worldTime-content', 'success', formatTime(info.world.worldTime));
    setElementState('reset-days-content', 'success', info.world.daysUntilReset);
    
    // Performance metrics
    setElementState('fps-content', 'success', info.performance.fps.toFixed(1));
    setElementState('frame-time-content', 'success', `${info.performance.frameTime.toFixed(2)} ms`);
    
    // Network stats
    setElementState('net-ids-content', 'success', formatNumber(info.network.idsFree));
    setElementState('bytes-sent-content', 'success', formatBytes(info.network.bytesSentPerSec) + '/s');
    setElementState('bytes-recv-content', 'success', formatBytes(info.network.bytesRecvPerSec) + '/s');
    setElementState('msgs-sent-content', 'success', formatNumber(info.network.pktsSentPerSec));
    setElementState('pkts-recv-content', 'success', formatNumber(info.network.pktsRecvPerSec));
    
    // Logs
    setElementState('logs-debug-content', 'success', formatNumber(info.logs.debug));
    setElementState('logs-warning-content', 'success', formatNumber(info.logs.warning));
    setElementState('logs-error-content', 'success', formatNumber(info.logs.error));
    if (document.getElementById('logs-exception-content')) {
      setElementState('logs-exception-content', 'success', formatNumber(info.logs.exception));
    }
    
    // AI statistics
    if (document.getElementById('ai-enabled-content')) {
      setElementState('ai-enabled-content', 'success', formatNumber(info.ai.enabled));
    }
    setElementState('ai-paths-content', 'success', formatNumber(info.ai.paths.success));
    if (document.getElementById('ai-paths-failed-content')) {
      setElementState('ai-paths-failed-content', 'success', formatNumber(info.ai.paths.failed));
    }
    
    // ECS information
    setElementState('ecs-archetypes-content', 'success', formatNumber(info.ecs.archetypes));
    if (document.getElementById('ecs-active-content')) {
      setElementState('ecs-active-content', 'success', formatNumber(info.ecs.active));
    }
    
    // Thread information
    setElementState('worker-threads-content', 'success', formatNumber(info.threads.worker));
    if (document.getElementById('threads-max-content')) {
      setElementState('threads-max-content', 'success', formatNumber(info.threads.max));
    }
    
    // Modifiables
    setElementState('modifiables-active-content', 'success', formatNumber(info.modifiables.activeCount));
    setElementState('modifiables-changes-content', 'success', formatNumber(info.modifiables.totalChanges));

  } catch (error) {
    console.error("Load info error:", error);
    metricElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) setElementState(id, 'error');
    });
  }
}

// Broadcast form
async function doBroadcast(e) {
  e.preventDefault();
  const msgInput = document.getElementById('broadcast-message');
  const statusEl = 'broadcast-status';
  const msg = msgInput.value;

  setElementState(statusEl, 'loading', 'Sending…');

  try {
    const response = await fetchWithTimeout(`${BASE}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const { success } = await response.json();

    setElementState(statusEl, success ? 'success' : 'error', success ? 'Sent!' : 'Failed');
    if (success) msgInput.value = ''; // Clear input on success
    // Clear status message after a few seconds
    setTimeout(() => setElementState(statusEl, 'success', ''), 3000);

  } catch (error) {
    console.error("Broadcast error:", error);
    setElementState(statusEl, 'error', `Failed (${error.message})`);
  }
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  refresh(); // Initial status load
  loadInfo(); // Initial info load

  document.getElementById('broadcast-form')?.addEventListener('submit', doBroadcast);
  // Add listener for the reload button
  document.getElementById('reload-btn')?.addEventListener('click', () => {
    refresh();
    loadInfo();
  });

  setInterval(refresh, 10000); // Periodic status refresh
  setInterval(loadInfo, 30000); // Periodic info refresh (less frequent)
});