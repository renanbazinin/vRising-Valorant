// public/client.js
const BASE = "https://rigorous-cheerful-canidae.glitch.me";
const FETCH_TIMEOUT = 10000; // 8seconds

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

// --- Core Functions ---

// Refresh status (players) every 10s
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
    const { online, players } = await response.json();

    setElementState(statusTextEl, 'success', online ? 'Online' : 'Offline');
    setElementState(playerCountEl, 'success', players);
    document.getElementById(indicatorEl)?.classList.add(online ? 'online' : 'offline');
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

// Load server info periodically
async function loadInfo() {
  const metricIds = ['uptime-content', 'day-content', 'fps-content', 'worldTime-content', 'clanCount-content'];
  metricIds.forEach(id => setElementState(id, 'loading'));

  try {
    const response = await fetchWithTimeout(`${BASE}/info`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const info = await response.json();

    setElementState('uptime-content', 'success', `${info.uptime}s`);
    setElementState('day-content', 'success', `Day ${info.day}`);
    setElementState('fps-content', 'success', `${info.fps} FPS`);
    setElementState('worldTime-content', 'success', info.worldTime != null ? `${info.worldTime}s` : '–');
    setElementState('clanCount-content', 'success', info.clanCount != null ? info.clanCount : '–');

  } catch (error) {
    console.error("Load info error:", error);
    metricIds.forEach(id => setElementState(id, 'error'));
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
  // Add listener for the new reload button
  document.getElementById('reload-btn')?.addEventListener('click', () => {
    refresh();
    loadInfo();
  });

  setInterval(refresh, 10000); // Periodic status refresh
  setInterval(loadInfo, 30000); // Periodic info refresh (less frequent)
});