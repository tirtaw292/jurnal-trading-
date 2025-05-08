// Trading Journal App - Complete Implementation

// App Configuration
const config = {
    pairs: [
        // Major Pairs
        'EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 
        'AUD/USD', 'USD/CAD', 'NZD/USD',
        
        // Minor Pairs
        'EUR/GBP', 'EUR/JPY', 'EUR/AUD', 'EUR/CAD', 
        'EUR/CHF', 'EUR/NZD', 'GBP/JPY', 'GBP/AUD',
        'GBP/CAD', 'GBP/CHF', 'GBP/NZD', 'CHF/JPY',
        'CAD/JPY', 'AUD/JPY', 'NZD/JPY',
        
        // Metals
        'XAU/USD', 'XAG/USD'
    ],
    defaultBalance: 10000,
    defaultRisk: 1
};

// Global Variables
let trades = [];
let currentUser = null;
let charts = {};
let currentCalendarDate = new Date();
let currentEditIndex = -1;

// DOM Elements
const elements = {
    loginScreen: document.getElementById('login-screen'),
    appContent: document.getElementById('app-content'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    tradeForm: document.getElementById('trade-form'),
    tradeDate: document.getElementById('trade-date'),
    currencyPair: document.getElementById('currency-pair'),
    tradeType: document.getElementById('trade-type'),
    entryPrice: document.getElementById('entry-price'),
    exitPrice: document.getElementById('exit-price'),
    positionSize: document.getElementById('position-size'),
    accountBalance: document.getElementById('account-balance'),
    riskPercent: document.getElementById('risk-percent'),
    takeProfit: document.getElementById('take-profit'),
    stopLoss: document.getElementById('stop-loss'),
    riskRewardRatio: document.getElementById('risk-reward-ratio'),
    notes: document.getElementById('notes'),
    pipsResult: document.getElementById('pips-result'),
    pnlResult: document.getElementById('pnl-result'),
    pnlPercentResult: document.getElementById('pnl-percent-result'),
    rrRatio: document.getElementById('rr-ratio'),
    tradesList: document.getElementById('trades-list'),
    tradeSearch: document.getElementById('trade-search'),
    exportExcel: document.getElementById('export-excel'),
    importExcel: document.getElementById('import-excel'),
    fileInput: document.getElementById('file-input'),
    winRate: document.getElementById('win-rate'),
    totalTrades: document.getElementById('total-trades'),
    totalPnl: document.getElementById('total-pnl'),
    profitFactor: document.getElementById('profit-factor'),
    monthlyChart: document.getElementById('monthly-chart'),
    tabContents: document.querySelectorAll('.tab-content'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    currentMonth: document.getElementById('current-month'),
    plCalendar: document.getElementById('pl-calendar'),
    fundamentalBtn: document.getElementById('fundamental-btn'),
    submitBtn: document.getElementById('submit-btn'),
    cancelEdit: document.getElementById('cancel-edit'),
    editIndicator: document.getElementById('edit-indicator')
};

// Initialize the App
function initApp() {
    // Set current date as default
    const today = new Date().toISOString().split('T')[0];
    elements.tradeDate.value = today;
    
    // Load trades from localStorage
    loadTrades();
    
    // Initialize event listeners
    setupEventListeners();
    
    // Calculate initial values
    calculateTradeResults();
    
    // Check dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.setAttribute('data-theme', 'dark');
        elements.darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Login Form
    elements.loginForm.addEventListener('submit', handleLogin);
    
    // Logout Button
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Dark Mode Toggle
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Trade Form Inputs
    elements.entryPrice.addEventListener('input', calculateTradeResults);
    elements.exitPrice.addEventListener('input', calculateTradeResults);
    elements.positionSize.addEventListener('input', calculateTradeResults);
    elements.currencyPair.addEventListener('change', calculateTradeResults);
    elements.tradeType.addEventListener('change', calculateTradeResults);
    elements.takeProfit.addEventListener('input', calculateTradeResults);
    elements.stopLoss.addEventListener('input', calculateTradeResults);
    
    // Trade Form Submission
    elements.tradeForm.addEventListener('submit', handleTradeSubmit);
    
    // Cancel Edit
    elements.cancelEdit.addEventListener('click', cancelEditTrade);
    
    // Tab Switching
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Search Functionality
    elements.tradeSearch.addEventListener('input', filterTrades);
    
    // Export/Import
    elements.exportExcel.addEventListener('click', exportToExcel);
    elements.importExcel.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', importFromExcel);
    
    // Calendar Navigation
    elements.prevMonth.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        generateCalendar();
    });
    
    elements.nextMonth.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        generateCalendar();
    });
    
    // Fundamental Button
    elements.fundamentalBtn.addEventListener('click', () => {
        window.open('https://www.forexfactory.com', '_blank');
    });
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (username && password) {
        currentUser = username;
        
        // Initialize user data if not exists
        if (!localStorage.getItem(`trades_${username}`)) {
            localStorage.setItem(`trades_${username}`, JSON.stringify([]));
            localStorage.setItem(`balance_${username}`, config.defaultBalance.toString());
        }
        
        // Load user data
        trades = JSON.parse(localStorage.getItem(`trades_${username}`)) || [];
        elements.accountBalance.value = localStorage.getItem(`balance_${username}`) || config.defaultBalance;
        
        // Switch to app view
        elements.loginScreen.style.display = 'none';
        elements.appContent.style.display = 'block';
        
        // Load data
        loadTrades();
        updateStats();
    } else {
        showError('Please enter both username and password');
    }
}

// Logout Handler
function handleLogout() {
    currentUser = null;
    trades = [];
    
    // Switch to login view
    elements.loginScreen.style.display = 'flex';
    elements.appContent.style.display = 'none';
    
    // Clear form
    elements.loginForm.reset();
}

// Trade Calculation
function calculateTradeResults() {
    const pair = elements.currencyPair.value;
    const tradeType = elements.tradeType.value;
    const entry = parseFloat(elements.entryPrice.value) || 0;
    const exit = parseFloat(elements.exitPrice.value) || 0;
    const size = parseFloat(elements.positionSize.value) || 0;
    const balance = parseFloat(elements.accountBalance.value) || config.defaultBalance;
    const stopLossPrice = parseFloat(elements.stopLoss.value) || 0;
    const takeProfitPrice = parseFloat(elements.takeProfit.value) || 0;
    
    if (!entry) return;
    
    // Calculate pips
    const isJPY = pair.includes('JPY') && !pair.startsWith('XAU') && !pair.startsWith('XAG');
    const isGoldSilver = pair.startsWith('XAU') || pair.startsWith('XAG');
    const pipMultiplier = isJPY ? 100 : isGoldSilver ? 10 : 10000;
    
    let pips = 0;
    if (exit > 0) {
        pips = tradeType === 'buy' 
            ? (exit - entry) * pipMultiplier
            : (entry - exit) * pipMultiplier;
    }
    
    // Calculate SL/TP in pips
    let slPips = 0;
    let tpPips = 0;
    
    if (stopLossPrice > 0) {
        slPips = tradeType === 'buy'
            ? (entry - stopLossPrice) * pipMultiplier
            : (stopLossPrice - entry) * pipMultiplier;
    }
    
    if (takeProfitPrice > 0) {
        tpPips = tradeType === 'buy'
            ? (takeProfitPrice - entry) * pipMultiplier
            : (entry - takeProfitPrice) * pipMultiplier;
    }
    
    // Calculate P/L in dollars
    let pnl = 0;
    if (exit > 0) {
        if (pair.startsWith('XAU')) {
            pnl = pips * 10 * size; // $10 per pip per standard lot for Gold
        } else if (pair.startsWith('XAG')) {
            pnl = pips * 50 * size; // $50 per pip per standard lot for Silver
        } else if (isJPY) {
            pnl = pips * 7 * size; // ~$7 per pip per standard lot for JPY pairs
        } else {
            pnl = pips * 10 * size; // $10 per pip per standard lot
        }
    }
    
    // Calculate P/L in percentage
    const pnlPercent = exit > 0 ? (pnl / balance) * 100 : 0;
    
    // Update UI
    elements.pipsResult.textContent = exit > 0 ? pips.toFixed(1) : "0";
    elements.pnlResult.textContent = exit > 0 ? pnl.toFixed(2) : "0.00";
    elements.pnlPercentResult.textContent = exit > 0 ? pnlPercent.toFixed(2) + '%' : "0.00%";
    
    // Update Risk/Reward
    if (slPips > 0) {
        const rrRatio = tpPips > 0 ? (tpPips / slPips).toFixed(2) : "1.00";
        elements.riskRewardRatio.textContent = rrRatio;
        elements.rrRatio.textContent = rrRatio;
    } else {
        elements.riskRewardRatio.textContent = "-";
        elements.rrRatio.textContent = "0.00";
    }
    
    return { pips, pnl, pnlPercent, slPips, tpPips };
}

// Trade Submission
function handleTradeSubmit(e) {
    e.preventDefault();
    
    // Calculate trade results
    const { pips, pnl, pnlPercent, slPips, tpPips } = calculateTradeResults();
    
    const trade = {
        date: elements.tradeDate.value,
        pair: elements.currencyPair.value,
        type: elements.tradeType.value,
        entry: parseFloat(elements.entryPrice.value),
        exit: parseFloat(elements.exitPrice.value),
        size: parseFloat(elements.positionSize.value),
        pips: pips,
        pnl: pnl,
        pnlPercent: pnlPercent,
        rrRatio: elements.rrRatio.textContent,
        takeProfit: tpPips,
        stopLoss: slPips,
        notes: elements.notes.value,
        outcome: pnl >= 0 ? 'win' : 'loss'
    };
    
    // Add to trades array
    if (currentEditIndex !== -1) {
        // Jika edit, simpan di posisi semula
        trades.splice(currentEditIndex, 0, trade);
    } else {
        // Jika baru, tambahkan di awal
        trades.unshift(trade);
    }
    
    // Update balance
    const newBalance = parseFloat(elements.accountBalance.value) + trade.pnl;
    elements.accountBalance.value = newBalance.toFixed(2);
    localStorage.setItem(`balance_${currentUser}`, newBalance.toString());
    
    // Save to localStorage
    localStorage.setItem(`trades_${currentUser}`, JSON.stringify(trades));
    
    // Reset form
    resetTradeForm();
    
    // Update UI
    loadTrades();
    updateStats();
    generateCalendar();
    
    // Show success message
    alert('Trade saved successfully!');
}

// Reset Trade Form
function resetTradeForm() {
    elements.tradeForm.reset();
    elements.tradeDate.value = new Date().toISOString().split('T')[0];
    elements.accountBalance.value = localStorage.getItem(`balance_${currentUser}`) || config.defaultBalance;
    elements.positionSize.value = "0.1";
    elements.riskPercent.value = "1";
    elements.editIndicator.style.display = 'none';
    elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Trade';
    elements.cancelEdit.style.display = 'none';
    document.querySelector('#journal h3').textContent = 'Add Trade';
    document.getElementById('trade-form').classList.remove('edit-mode');
    currentEditIndex = -1;
}

// Edit Trade
function editTrade(index) {
    switchTab('journal');
    currentEditIndex = index;
    const trade = trades.splice(index, 1)[0];
    
    // Fill form with trade data
    elements.tradeDate.value = trade.date;
    elements.currencyPair.value = trade.pair;
    elements.tradeType.value = trade.type;
    elements.entryPrice.value = trade.entry;
    elements.exitPrice.value = trade.exit;
    elements.positionSize.value = trade.size;
    elements.accountBalance.value = localStorage.getItem(`balance_${currentUser}`) || config.defaultBalance;
    elements.notes.value = trade.notes || '';
    
    // Calculate TP/SL prices from pips
    const isJPY = trade.pair.includes('JPY') && !trade.pair.startsWith('XAU') && !trade.pair.startsWith('XAG');
    const pipMultiplier = isJPY ? 100 : (trade.pair.startsWith('XAU') || trade.pair.startsWith('XAG')) ? 10 : 10000;
    
    if (trade.stopLoss > 0) {
        const slPrice = trade.type === 'buy' 
            ? (trade.entry - (trade.stopLoss / pipMultiplier)).toFixed(isJPY ? 3 : 5)
            : (trade.entry + (trade.stopLoss / pipMultiplier)).toFixed(isJPY ? 3 : 5);
        elements.stopLoss.value = slPrice;
    }
    
    if (trade.takeProfit > 0) {
        const tpPrice = trade.type === 'buy'
            ? (trade.entry + (trade.takeProfit / pipMultiplier)).toFixed(isJPY ? 3 : 5)
            : (trade.entry - (trade.takeProfit / pipMultiplier)).toFixed(isJPY ? 3 : 5);
        elements.takeProfit.value = tpPrice;
    }
    
    // Update UI for edit mode
    elements.editIndicator.style.display = 'inline';
    elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Trade';
    elements.cancelEdit.style.display = 'inline-block';
    document.querySelector('#journal h3').textContent = 'Edit Trade';
    
    // Calculate and update results
    calculateTradeResults();
    
    // Scroll to form
    document.getElementById('trade-form').classList.add('edit-mode');
    document.getElementById('journal').scrollIntoView({ behavior: 'smooth' });
}

// Cancel Edit
function cancelEditTrade() {
    if (currentEditIndex !== -1) {
        // Kembalikan data dari localStorage
        const originalTrades = JSON.parse(localStorage.getItem(`trades_${currentUser}`)) || [];
        trades = [...originalTrades]; // Buat salinan baru
    }
    
    resetTradeForm();
    loadTrades();
    updateStats();
}

// Delete Trade
function deleteTrade(index) {
    if (confirm('Are you sure you want to delete this trade?')) {
        // Get trade P/L to adjust balance
        const trade = trades[index];
        const newBalance = parseFloat(elements.accountBalance.value) - trade.pnl;
        elements.accountBalance.value = newBalance.toFixed(2);
        localStorage.setItem(`balance_${currentUser}`, newBalance.toString());
        
        // Remove trade
        trades.splice(index, 1);
        localStorage.setItem(`trades_${currentUser}`, JSON.stringify(trades));
        
        // Update UI
        loadTrades();
        updateStats();
        generateCalendar();
    }
}

// Load Trades into Table
function loadTrades() {
    elements.tradesList.innerHTML = '';
    
    trades.forEach((trade, index) => {
        const row = document.createElement('tr');
        
        // Determine row class based on outcome
        const rowClass = trade.outcome === 'win' ? 'win-row' : 'loss-row';
        row.className = rowClass;
        
        // Format decimals based on pair type
        const isJPY = trade.pair.includes('JPY') && !trade.pair.startsWith('XAU') && !trade.pair.startsWith('XAG');
        const decimals = isJPY ? 3 : 5;
        
        row.innerHTML = `
            <td>${trade.date}</td>
            <td>${trade.pair}</td>
            <td class="${trade.type}">${trade.type.toUpperCase()}</td>
            <td>${trade.entry.toFixed(decimals)}</td>
            <td>${trade.exit.toFixed(decimals)}</td>
            <td>${trade.pips.toFixed(1)}</td>
            <td class="${trade.pnl >= 0 ? 'positive' : 'negative'}">${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}</td>
            <td class="${trade.pnlPercent >= 0 ? 'positive' : 'negative'}">${trade.pnlPercent >= 0 ? '+' : ''}${trade.pnlPercent.toFixed(2)}%</td>
            <td>${trade.rrRatio}</td>
            <td>
                <button class="btn-small edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
                <button class="btn-small delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        elements.tradesList.appendChild(row);
    });
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            editTrade(index);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            deleteTrade(index);
        });
    });
}

// Filter Trades
function filterTrades() {
    const searchTerm = elements.tradeSearch.value.toLowerCase();
    const rows = elements.tradesList.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Update Statistics
function updateStats() {
    if (trades.length === 0) {
        elements.winRate.textContent = '0%';
        elements.totalTrades.textContent = '0';
        elements.totalPnl.textContent = '$0.00';
        elements.profitFactor.textContent = '0.00';
        return;
    }
    
    // Calculate win rate
    const winningTrades = trades.filter(trade => trade.outcome === 'win').length;
    const winRate = (winningTrades / trades.length) * 100;
    elements.winRate.textContent = winRate.toFixed(1) + '%';
    
    // Total trades
    elements.totalTrades.textContent = trades.length;
    
    // Total P/L
    const totalPnl = trades.reduce((sum, trade) => sum + trade.pnl, 0);
    elements.totalPnl.textContent = totalPnl >= 0 ? '$' + totalPnl.toFixed(2) : '-$' + Math.abs(totalPnl).toFixed(2);
    
    // Profit factor
    const totalWins = trades.filter(trade => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0);
    const totalLosses = trades.filter(trade => trade.pnl < 0).reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    elements.profitFactor.textContent = profitFactor.toFixed(2);
    
    // Update charts
    updateCharts();
}

// Tab Switching
function switchTab(tabId) {
    // Update active tab button
    elements.tabButtons.forEach(button => {
        button.classList.toggle('active', button.getAttribute('data-tab') === tabId);
    });
    
    // Show selected tab content
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
    
    // Initialize charts if stats tab is selected
    if (tabId === 'stats' && !charts.monthly) {
        initCharts();
    }
    
    // Generate calendar if calendar tab is selected
    if (tabId === 'calendar') {
        generateCalendar();
    }
}

// Initialize Charts
function initCharts() {
    // Monthly Performance Chart
    const ctx = elements.monthlyChart.getContext('2d');
    charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly P/L ($)',
                data: [],
                backgroundColor: '#4361ee',
                borderColor: '#3a0ca3',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    updateCharts();
}

// Update Charts with Data
function updateCharts() {
    if (!charts.monthly) return;
    
    // Group trades by month
    const monthlyData = {};
    trades.forEach(trade => {
        const date = new Date(trade.date);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        
        monthlyData[monthYear] += trade.pnl;
    });
    
    // Prepare chart data
    const labels = Object.keys(monthlyData).sort();
    const data = labels.map(label => monthlyData[label]);
    
    // Update chart
    charts.monthly.data.labels = labels;
    charts.monthly.data.datasets[0].data = data;
    charts.monthly.update();
}

// Generate P/L Calendar
function generateCalendar() {
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                       "July", "August", "September", "October", "November", "December"];
    
    // Set month/year header
    elements.currentMonth.textContent = 
        `${monthNames[currentCalendarDate.getMonth()]} ${currentCalendarDate.getFullYear()}`;
    
    // Get first day of month and total days
    const firstDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), 1);
    const lastDay = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Clear calendar
    elements.plCalendar.innerHTML = '';
    
    // Add day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day calendar-day-header';
        dayHeader.textContent = day;
        elements.plCalendar.appendChild(dayHeader);
    });
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        elements.plCalendar.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentCalendarDate.getFullYear()}-${(currentCalendarDate.getMonth()+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTrades = trades.filter(t => t.date === dateStr);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        if (dayTrades.length > 0) {
            const dayPL = dayTrades.reduce((sum, trade) => sum + trade.pnl, 0);
            const dayPLPercent = dayTrades.reduce((sum, trade) => sum + trade.pnlPercent, 0);
            
            const plInfo = document.createElement('div');
            plInfo.className = 'calendar-pl-info';
            plInfo.innerHTML = `
                <div>$${dayPL.toFixed(2)}</div>
                <div>${dayPLPercent.toFixed(2)}%</div>
            `;
            dayElement.appendChild(plInfo);
            
            if (dayPL > 0) {
                dayElement.classList.add('day-profit');
            } else if (dayPL < 0) {
                dayElement.classList.add('day-loss');
            } else {
                dayElement.classList.add('day-breakeven');
            }
            
            // Add tooltip with detailed info
            dayElement.title = `${dayTrades.length} trade(s)\nP/L: $${dayPL.toFixed(2)}\nP/L%: ${dayPLPercent.toFixed(2)}%`;
        }
        
        elements.plCalendar.appendChild(dayElement);
    }
}

// Export to Excel
function exportToExcel() {
    if (trades.length === 0) {
        alert('No trades to export');
        return;
    }
    
    // Prepare worksheet
    const ws = XLSX.utils.json_to_sheet(trades);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trades');
    
    // Export file
    XLSX.writeFile(wb, `trading_journal_${currentUser}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Import from Excel
function importFromExcel(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
            if (confirm(`Import ${jsonData.length} trades? This will replace your current trades.`)) {
                trades = jsonData;
                localStorage.setItem(`trades_${currentUser}`, JSON.stringify(trades));
                loadTrades();
                updateStats();
                generateCalendar();
                alert('Trades imported successfully!');
            }
        } else {
            alert('No valid trade data found in the file');
        }
    };
    reader.readAsArrayBuffer(file);
}

// Dark Mode Toggle
function toggleDarkMode() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('darkMode', isDark ? 'disabled' : 'enabled');
    elements.darkModeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// Error Display
function showError(message) {
    elements.loginError.textContent = message;
    elements.loginError.style.display = 'block';
    
    setTimeout(() => {
        elements.loginError.style.display = 'none';
    }, 3000);
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
