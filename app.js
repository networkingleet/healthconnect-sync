// Health Sync App JavaScript
// Configuration
const CONFIG = {
    API_BASE: 'http://192.168.1.41:18081/api',
    API_KEY: 'asdfasdfasdfFSDFWEFWF3123sdfsdaf12313_123123sdassdf14s1324',
    SYNC_INTERVAL: 30 * 60 * 1000, // 30 minutes in milliseconds
    STORAGE_KEYS: {
        AUTO_SYNC: 'health_sync_auto',
        LAST_SYNC: 'health_sync_last',
        ACTIVITY_DATA: 'health_sync_activity'
    }
};

// Global state
let autoSyncInterval = null;
let isOnline = navigator.onLine;

// Initialize the app
function initializeApp() {
    console.log('🚀 Initializing Health Sync App');
    
    // Display API endpoint
    document.getElementById('apiEndpoint').textContent = CONFIG.API_BASE;
    
    // Load saved settings
    loadSettings();
    
    // Load activity data
    loadActivityData();
    
    // Load sync logs
    loadSyncLogs();
    
    // Set up auto sync if enabled
    setupAutoSync();
    
    // Set up online/offline detection
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection test
    testConnection(false);
    
    console.log('✅ App initialized successfully');
}

// Load settings from localStorage
function loadSettings() {
    const autoSync = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTO_SYNC);
    const isAutoSyncEnabled = autoSync !== 'false'; // Default to true
    
    document.getElementById('autoSync').checked = isAutoSyncEnabled;
    
    const lastSync = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC);
    if (lastSync) {
        const syncTime = new Date(lastSync);
        document.getElementById('lastSync').textContent = syncTime.toLocaleTimeString();
    }
}

// Save settings to localStorage
function saveSettings() {
    const autoSync = document.getElementById('autoSync').checked;
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTO_SYNC, autoSync.toString());
}

// Load activity data from localStorage or API
function loadActivityData() {
    const savedData = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVITY_DATA);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            updateActivityDisplay(data);
        } catch (e) {
            console.error('Error parsing saved activity data:', e);
        }
    }
}

// Update activity display
function updateActivityDisplay(data) {
    if (data.activity_data && data.activity_data[0]) {
        const activity = data.activity_data[0];
        document.getElementById('steps').textContent = activity.steps.toLocaleString();
        document.getElementById('calories').textContent = activity.calories_burned;
    }
    
    if (data.sleep_data && data.sleep_data[0]) {
        const sleep = data.sleep_data[0];
        const hours = Math.round(sleep.sleep_duration_minutes / 60 * 10) / 10;
        document.getElementById('sleep').textContent = hours;
    }
    
    // Save to localStorage
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVITY_DATA, JSON.stringify(data));
}

// Generate health data (placeholder for real Health Connect integration)
async function getHealthData() {
    // In a real implementation, this would use the Health Connect API
    // For now, we'll generate realistic dummy data
    
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Generate realistic steps (5000-12000)
    const steps = Math.floor(Math.random() * 7000) + 5000;
    
    // Generate realistic calories (250-600)
    const calories = Math.floor(Math.random() * 350) + 250;
    
    // Generate realistic sleep (6-9 hours in minutes)
    const sleepHours = Math.random() * 3 + 6; // 6-9 hours
    const sleepMinutes = Math.floor(sleepHours * 60);
    
    return {
        sync_type: 'full',
        activity_data: [{
            date: today.toISOString().split('T')[0],
            steps: steps,
            calories_burned: calories,
            distance_m: Math.floor(steps * 0.7), // Rough estimate
            active_minutes: Math.floor(calories / 5), // Rough estimate
            source: 'health_sync_app'
        }],
        sleep_data: [{
            date: yesterday.toISOString().split('T')[0],
            sleep_duration_minutes: sleepMinutes,
            sleep_score: Math.floor(Math.random() * 20) + 80, // 80-100
            source: 'health_sync_app'
        }],
        device_info: 'Health Sync PWA v1.0',
        triggered_by: 'manual'
    };
}

// Main sync function
async function syncNow() {
    console.log('🔄 Starting sync...');
    
    // Update UI
    const statusEl = document.getElementById('status');
    const syncBtn = document.getElementById('syncBtn');
    const syncBtnText = document.getElementById('syncBtnText');
    
    statusEl.className = 'status syncing';
    statusEl.innerHTML = '<span class="loading"></span>Syncing...';
    syncBtn.disabled = true;
    syncBtnText.textContent = 'Syncing...';
    
    try {
        // Get health data
        const healthData = await getHealthData();
        console.log('📊 Health data collected:', healthData);
        
        // Send to API
        const response = await fetch(`${CONFIG.API_BASE}/fitbit/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CONFIG.API_KEY
            },
            body: JSON.stringify(healthData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Sync successful:', result);
            
            // Update UI
            statusEl.className = 'status success';
            statusEl.textContent = `✓ Synced ${result.records_synced} records`;
            
            // Update activity display
            updateActivityDisplay(healthData);
            
            // Update last sync time
            const now = new Date();
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC, now.toISOString());
            document.getElementById('lastSync').textContent = now.toLocaleTimeString();
            
            // Add to logs
            addSyncLog('success', `Synced ${result.records_synced} records`);
            
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        
        // Update UI
        statusEl.className = 'status error';
        statusEl.textContent = '✗ Sync failed';
        
        // Add to logs
        addSyncLog('error', error.message);
        
        // If offline, queue for later
        if (!isOnline) {
            console.log('📱 Offline - sync will retry when online');
            statusEl.textContent = '📱 Queued for retry';
        }
    } finally {
        // Re-enable button
        syncBtn.disabled = false;
        syncBtnText.textContent = '🔄 Sync Now';
        
        // Reset status after delay
        setTimeout(() => {
            if (statusEl.className !== 'status syncing') {
                statusEl.className = 'status ready';
                statusEl.textContent = 'Ready to sync';
            }
        }, 3000);
    }
}

// Test API connection
async function testConnection(showResult = true) {
    try {
        const response = await fetch(`${CONFIG.API_BASE}/health`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            if (showResult) {
                alert('✅ Connection successful!\n\nServer is online and responding.');
            }
            return true;
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        if (showResult) {
            alert(`❌ Connection failed!\n\nError: ${error.message}\n\nCheck your server IP and network connection.`);
        }
        console.error('Connection test failed:', error);
        return false;
    }
}

// Toggle auto sync
function toggleAutoSync() {
    const isEnabled = document.getElementById('autoSync').checked;
    saveSettings();
    setupAutoSync();
    
    const message = isEnabled ? 'Auto sync enabled' : 'Auto sync disabled';
    console.log('⚙️', message);
    
    // Show brief confirmation
    const statusEl = document.getElementById('status');
    const originalClass = statusEl.className;
    const originalText = statusEl.textContent;
    
    statusEl.className = 'status ready';
    statusEl.textContent = message;
    
    setTimeout(() => {
        statusEl.className = originalClass;
        statusEl.textContent = originalText;
    }, 2000);
}

// Setup auto sync interval
function setupAutoSync() {
    // Clear existing interval
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
    
    // Set up new interval if enabled
    const isEnabled = document.getElementById('autoSync').checked;
    if (isEnabled) {
        autoSyncInterval = setInterval(() => {
            console.log('⏰ Auto sync triggered');
            syncNow();
        }, CONFIG.SYNC_INTERVAL);
        
        console.log('⏰ Auto sync enabled (30 minute interval)');
    } else {
        console.log('⏰ Auto sync disabled');
    }
}

// Handle online status
function handleOnline() {
    isOnline = true;
    console.log('🌐 Back online');
    
    const statusEl = document.getElementById('status');
    if (statusEl.textContent.includes('Queued')) {
        statusEl.className = 'status ready';
        statusEl.textContent = 'Ready to sync';
        
        // Auto sync when back online
        setTimeout(syncNow, 1000);
    }
}

function handleOffline() {
    isOnline = false;
    console.log('📱 Gone offline');
}

// Sync logs management
function addSyncLog(type, message) {
    const logs = getSyncLogs();
    const timestamp = new Date().toISOString();
    
    logs.unshift({
        timestamp,
        type,
        message
    });
    
    // Keep only last 50 logs
    if (logs.length > 50) {
        logs.splice(50);
    }
    
    localStorage.setItem('health_sync_logs', JSON.stringify(logs));
    
    // Update logs display if visible
    if (!document.getElementById('logsContainer').classList.contains('hidden')) {
        displaySyncLogs();
    }
}

function getSyncLogs() {
    try {
        const logs = localStorage.getItem('health_sync_logs');
        return logs ? JSON.parse(logs) : [];
    } catch (e) {
        return [];
    }
}

function displaySyncLogs() {
    const logs = getSyncLogs();
    const container = document.getElementById('logsList');
    
    if (logs.length === 0) {
        container.innerHTML = '<div class="log-entry">No sync logs yet</div>';
        return;
    }
    
    const logsHtml = logs.slice(0, 20).map(log => {
        const time = new Date(log.timestamp).toLocaleString();
        const typeClass = log.type === 'error' ? 'error' : '';
        const icon = log.type === 'error' ? '❌' : '✅';
        
        return `
            <div class="log-entry ${typeClass}">
                <div class="log-time">${time}</div>
                <div>${icon} ${log.message}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = logsHtml;
}

async function loadSyncLogs() {
    try {
        // Try to load from API first
        const response = await fetch(`${CONFIG.API_BASE}/fitbit/sync-logs?limit=10`);
        if (response.ok) {
            const data = await response.json();
            // Convert API logs to local format
            const apiLogs = data.logs.map(log => ({
                timestamp: log.timestamp,
                type: log.status === 'success' ? 'success' : 'error',
                message: `${log.status}: ${log.records_synced} records (${log.sync_type})`
            }));
            
            // Merge with local logs
            const localLogs = getSyncLogs();
            const allLogs = [...apiLogs, ...localLogs]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 50);
            
            localStorage.setItem('health_sync_logs', JSON.stringify(allLogs));
        }
    } catch (e) {
        console.log('Could not load API logs, using local logs only');
    }
    
    displaySyncLogs();
}

function toggleLogs() {
    const container = document.getElementById('logsContainer');
    const isHidden = container.classList.contains('hidden');
    
    if (isHidden) {
        container.classList.remove('hidden');
        displaySyncLogs();
    } else {
        container.classList.add('hidden');
    }
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// Export functions for debugging
window.HealthSync = {
    syncNow,
    testConnection,
    toggleAutoSync,
    toggleLogs,
    loadSyncLogs,
    getHealthData,
    CONFIG
};

console.log('🏃‍♂️ Health Sync App Loaded');
console.log('Debug functions available at: window.HealthSync'); 