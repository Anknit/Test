// API Base URL
const API_BASE = window.location.origin;

// Global state
let autoRefreshInterval = null;
let enctokenCheckInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check enctoken validity first
    await checkEnctokenValidity();

    checkConnection();
    refreshStatus();
    loadLogs();

    // Auto-refresh status every 5 seconds
    autoRefreshInterval = setInterval(() => {
        refreshStatus();
    }, 5000);

    // Check enctoken validity every 5 minutes
    enctokenCheckInterval = setInterval(() => {
        checkEnctokenValidity();
    }, 5 * 60 * 1000);
});

// Connection check
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
            updateConnectionStatus(true);
        } else {
            updateConnectionStatus(false);
        }
    } catch (error) {
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const badge = document.getElementById('connectionStatus');
    if (connected) {
        badge.classList.add('connected');
        badge.querySelector('.text').textContent = 'Connected';
    } else {
        badge.classList.remove('connected');
        badge.querySelector('.text').textContent = 'Disconnected';
    }
}

// Check enctoken validity
async function checkEnctokenValidity() {
    try {
        const response = await fetch(`${API_BASE}/api/enctoken/validate`);
        const data = await response.json();

        if (data.success && data.data) {
            const { valid, error } = data.data;
            const loginCard = document.getElementById('loginCard');

            if (!valid) {
                // Enctoken is invalid
                // Show login card in sidebar
                if (loginCard) {
                    loginCard.style.display = 'block';
                }

                // Also show login modal to block UI
                showLoginModal(error || 'Enctoken is expired or invalid');
                return false;
            } else {
                // Enctoken is valid
                // Hide login card
                if (loginCard) {
                    loginCard.style.display = 'none';
                }

                // Hide login modal if shown
                hideLoginModal();
                return true;
            }
        }
    } catch (error) {
        console.error('Error checking enctoken validity:', error);
    }
    return false;
}

// Show login modal
function showLoginModal(message) {
    let modal = document.getElementById('loginModal');

    // Create modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Login Required</h2>
                </div>
                <div class="modal-body">
                    <p class="error-message" id="loginModalMessage">${message}</p>
                    <p>Please login with your Kite credentials to continue:</p>

                    <form id="modalLoginForm" onsubmit="handleModalLogin(event)">
                        <div class="form-group">
                            <label for="modalUserId">User ID</label>
                            <input type="text" id="modalUserId" placeholder="AB1234" required>
                        </div>
                        <div class="form-group">
                            <label for="modalPassword">Password</label>
                            <input type="password" id="modalPassword" required>
                        </div>
                        <div class="form-group">
                            <label for="modalTotp">2FA Code</label>
                            <input type="text" id="modalTotp" placeholder="123456" maxlength="6" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block" id="modalLoginBtn">
                            Login & Resume
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.add('show');
        document.getElementById('loginModalMessage').textContent = message;
    }

    // Disable main UI
    document.querySelector('.container').style.opacity = '0.5';
    document.querySelector('.container').style.pointerEvents = 'none';
}

// Hide login modal
function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('show');
    }

    // Re-enable main UI
    document.querySelector('.container').style.opacity = '1';
    document.querySelector('.container').style.pointerEvents = 'auto';
}

// Handle modal login
async function handleModalLogin(event) {
    event.preventDefault();

    const userId = document.getElementById('modalUserId').value;
    const password = document.getElementById('modalPassword').value;
    const totp = document.getElementById('modalTotp').value;
    const button = document.getElementById('modalLoginBtn');

    button.textContent = 'Logging in...';
    button.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/enctoken/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password, totp })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Login successful! Enctoken updated.', 'success');
            hideLoginModal();

            // Clear form
            document.getElementById('modalLoginForm').reset();

            // Refresh status
            await refreshStatus();
        } else {
            showToast(`Login failed: ${data.error}`, 'error');
            document.getElementById('loginModalMessage').textContent = data.error;
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        button.textContent = 'Login & Resume';
        button.disabled = false;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Refresh system status
async function refreshStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        const data = await response.json();

        if (data.success) {
            const status = data.data;

            // Update status display
            document.getElementById('tradingStatus').textContent =
                status.running ? '🟢 Running' : '🔴 Stopped';
            document.getElementById('processPid').textContent =
                status.pid || '-';
            document.getElementById('processUptime').textContent =
                status.uptime ? formatUptime(status.uptime) : '-';
            document.getElementById('enctokenStatus').textContent =
                status.enctokenValid ? '✅ Valid' : '❌ Invalid';
        }
    } catch (error) {
        console.error('Error fetching status:', error);
    }
}

// Format uptime in seconds to readable format
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const totp = document.getElementById('totp').value;

    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '⏳ Logging in...';

    try {
        const response = await fetch(`${API_BASE}/api/enctoken/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, password, totp })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Login successful! Enctoken updated.', 'success');
            document.getElementById('loginForm').reset();

            // Hide login card after successful login
            const loginCard = document.getElementById('loginCard');
            if (loginCard) {
                loginCard.style.display = 'none';
            }

            refreshStatus();
            // Recheck enctoken to hide modal
            await checkEnctokenValidity();
        } else {
            showToast(`Login failed: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = '🔑 Login & Fetch Enctoken';
    }
}

// Save trading parameters
function saveParameters() {
    const params = {
        capital: parseInt(document.getElementById('capital').value),
        timeframe: parseInt(document.getElementById('timeframe').value),
        slTicks: parseInt(document.getElementById('slTicks').value),
        targetTicks: parseInt(document.getElementById('targetTicks').value),
        riskPercent: parseFloat(document.getElementById('riskPercent').value)
    };

    // Save to localStorage
    localStorage.setItem('tradingParameters', JSON.stringify(params));
    showToast('Parameters saved successfully', 'success');
}

// Load trading parameters
function loadParameters() {
    const saved = localStorage.getItem('tradingParameters');

    if (saved) {
        const params = JSON.parse(saved);
        document.getElementById('capital').value = params.capital;
        document.getElementById('timeframe').value = params.timeframe;
        document.getElementById('slTicks').value = params.slTicks;
        document.getElementById('targetTicks').value = params.targetTicks;
        document.getElementById('riskPercent').value = params.riskPercent;
        showToast('Parameters loaded successfully', 'success');
    } else {
        showToast('No saved parameters found', 'info');
    }
}

// Get current parameters
function getCurrentParameters() {
    // Try to load from localStorage first
    const saved = localStorage.getItem('tradingParameters');
    if (saved) {
        return JSON.parse(saved);
    }

    // Otherwise use current form values
    return {
        capital: parseInt(document.getElementById('capital').value),
        timeframe: parseInt(document.getElementById('timeframe').value),
        slTicks: parseInt(document.getElementById('slTicks').value),
        targetTicks: parseInt(document.getElementById('targetTicks').value),
        riskPercent: parseFloat(document.getElementById('riskPercent').value)
    };
}

// Handle start trading
async function handleStartTrading(event) {
    event.preventDefault();

    const instrument = document.getElementById('instrument').value;
    const paper = document.getElementById('paperMode').checked;
    const notimeexit = document.getElementById('noTimeExit').checked;
    const params = getCurrentParameters();

    const button = event.target.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = '⏳ Starting...';

    try {
        const response = await fetch(`${API_BASE}/api/trading/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instrument,
                paper,
                notimeexit,
                ...params  // Include trading parameters
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Trading started successfully!', 'success');
            refreshStatus();
        } else {
            showToast(`Failed to start: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = '▶️ Start Trading';
    }
}

// Stop trading
async function stopTrading() {
    if (!confirm('Are you sure you want to stop trading?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/trading/stop`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Trading stopped successfully.', 'success');
            refreshStatus();
        } else {
            showToast(`Failed to stop: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Load logs
async function loadLogs() {
    const lines = document.getElementById('logLines').value;
    const container = document.getElementById('logsContainer');

    container.innerHTML = '<div class="loading">Loading logs...</div>';

    try {
        const response = await fetch(`${API_BASE}/api/logs?lines=${lines}`);
        const data = await response.json();

        if (data.success && data.data.logs.length > 0) {
            container.innerHTML = data.data.logs
                .map(log => {
                    let className = 'log-line';
                    if (log.includes('[ERROR]')) className += ' error';
                    else if (log.includes('[WARN]')) className += ' warning';
                    else if (log.includes('[INFO]')) className += ' info';

                    return `<div class="${className}">${escapeHtml(log)}</div>`;
                })
                .join('');

            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        } else {
            container.innerHTML = '<div class="loading">No logs available.</div>';
        }
    } catch (error) {
        container.innerHTML = `<div class="loading">Error loading logs: ${error.message}</div>`;
    }
}

// Filter logs
function filterLogs() {
    const filter = document.getElementById('logFilter').value.toLowerCase();
    const logs = document.querySelectorAll('.log-line');

    logs.forEach(log => {
        const text = log.textContent.toLowerCase();
        log.style.display = text.includes(filter) ? 'block' : 'none';
    });
}

// Clear logs
async function clearLogs() {
    if (!confirm('Are you sure you want to clear all logs?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/logs/clear`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Logs cleared successfully.', 'success');
            loadLogs();
        } else {
            showToast(`Failed to clear logs: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Run backtest
async function runBacktest() {
    const instrument = document.getElementById('instrument').value;
    const notimeexit = document.getElementById('noTimeExit').checked;
    const params = getCurrentParameters();

    showToast('Running backtest... This may take a minute.', 'info');

    try {
        const response = await fetch(`${API_BASE}/api/backtest/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instrument,
                notimeexit,
                ...params  // Include trading parameters
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Backtest completed successfully!', 'success');
            setTimeout(() => loadBacktestResults(), 1000);
        } else {
            showToast(`Backtest failed: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Load backtest results
async function loadBacktestResults() {
    const container = document.getElementById('backtestResults');
    container.innerHTML = '<div class="loading">Loading results...</div>';

    try {
        const response = await fetch(`${API_BASE}/api/backtest/results`);
        const data = await response.json();

        if (data.success && data.data) {
            const results = data.data;
            container.innerHTML = `
                <div class="metrics-grid">
                    <div class="metric-card ${results.totalPnl > 0 ? 'positive' : 'negative'}">
                        <div class="metric-label">Total P&L</div>
                        <div class="metric-value ${results.totalPnl > 0 ? 'positive' : 'negative'}">
                            ₹${results.totalPnl?.toLocaleString() || 0}
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Total Trades</div>
                        <div class="metric-value">${results.trades || 0}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Win Rate</div>
                        <div class="metric-value">${((results.winRate || 0) * 100).toFixed(2)}%</div>
                    </div>
                    <div class="metric-card ${results.profitFactor > 1 ? 'positive' : 'negative'}">
                        <div class="metric-label">Profit Factor</div>
                        <div class="metric-value">${(results.profitFactor || 0).toFixed(2)}</div>
                    </div>
                    <div class="metric-card positive">
                        <div class="metric-label">Avg Win</div>
                        <div class="metric-value positive">₹${results.avgWin?.toLocaleString() || 0}</div>
                    </div>
                    <div class="metric-card negative">
                        <div class="metric-label">Avg Loss</div>
                        <div class="metric-value negative">₹${results.avgLoss?.toLocaleString() || 0}</div>
                    </div>
                </div>
            `;

            // Switch to backtest tab
            showTab('backtest');
        } else {
            container.innerHTML = '<p class="empty-state">No backtest results available.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="empty-state">Error loading results: ${error.message}</p>`;
    }
}

// View cache
async function viewCache() {
    showTab('cache');

    const container = document.getElementById('cacheFiles');
    container.innerHTML = '<div class="loading">Loading cache files...</div>';

    try {
        const response = await fetch(`${API_BASE}/api/cache`);
        const data = await response.json();

        if (data.success && data.data.files.length > 0) {
            container.innerHTML = `
                <ul class="cache-list">
                    ${data.data.files.map(file => `
                        <li class="cache-item">
                            <div>
                                <div class="cache-item-name">${file.name}</div>
                                <div class="cache-item-meta">
                                    ${formatFileSize(file.size)} • Modified: ${new Date(file.modified).toLocaleString()}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            container.innerHTML = '<p class="empty-state">No cache files found.</p>';
        }
    } catch (error) {
        container.innerHTML = `<p class="empty-state">Error loading cache: ${error.message}</p>`;
    }
}

// Clear cache
async function clearCache() {
    if (!confirm('Are you sure you want to clear all cache files?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/cache/clear`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message, 'success');
            viewCache();
        } else {
            showToast(`Failed to clear cache: ${data.error}`, 'error');
        }
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Add active class to corresponding button
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach((btn, index) => {
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });

    // Load data for specific tabs
    if (tabName === 'logs') {
        loadLogs();
    } else if (tabName === 'cache') {
        viewCache();
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
