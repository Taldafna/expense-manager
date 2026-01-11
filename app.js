/**
 * Main Application Logic
 * Handles UI interactions, navigation, and rendering
 */

// Application State
const app = {
    currentUser: null,
    currentYear: new Date().getFullYear(),
    currentMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    currentScreen: 'user-select'
};

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Initialize Application
function initApp() {
    setupEventListeners();
    setDefaultDate();
}

// Setup Event Listeners
function setupEventListeners() {
    // User selection
    document.querySelectorAll('.user-card').forEach(card => {
        card.addEventListener('click', () => selectUser(card.dataset.user));
    });

    // Back to user selection
    document.getElementById('btn-back-to-users').addEventListener('click', () => {
        app.currentUser = null;
        document.body.className = ''; // Clear theme
        showScreen('user-select');
    });

    // Navigation cards
    document.querySelectorAll('.nav-card').forEach(card => {
        card.addEventListener('click', () => {
            const screen = card.dataset.screen;
            showScreen(screen);
            if (screen === 'forecast') renderForecast();
            if (screen === 'month') renderMonthDashboard();
            if (screen === 'analytics') renderAnalytics();
            if (screen === 'stats') renderStats();
            if (screen === 'categories') renderCategories();
            if (screen === 'history') renderHistory();
            if (screen === 'wishlist') renderWishlist();
            if (screen === 'shared') renderSharedView();
        });
    });

    // Shared View listeners
    document.getElementById('shared-year-select').addEventListener('change', (e) => {
        app.currentYear = parseInt(e.target.value);
        renderSharedView();
    });
    document.getElementById('shared-month-select').addEventListener('change', (e) => {
        app.currentMonth = e.target.value;
        renderSharedView();
    });


    // History listeners
    document.getElementById('history-search').addEventListener('input', () => renderHistory());
    document.getElementById('history-filter-category').addEventListener('change', () => renderHistory());
    document.getElementById('history-filter-user').addEventListener('change', () => renderHistory());

    // Wishlist listeners
    document.getElementById('btn-add-goal').addEventListener('click', openWishlistModal);
    document.getElementById('btn-close-wishlist').addEventListener('click', closeWishlistModal);
    document.getElementById('wishlist-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveWishlistGoal();
    });

    // Recurring listeners
    document.getElementById('btn-manage-recurring').addEventListener('click', openRecurringModal);
    document.getElementById('btn-close-recurring').addEventListener('click', closeRecurringModal);
    document.getElementById('btn-save-recurring-template').addEventListener('click', saveRecurringTemplate);
    document.getElementById('btn-apply-recurring').addEventListener('click', applyRecurring);

    // Back buttons
    document.querySelectorAll('.btn-back[data-back]').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.back));
    });

    // Year navigation
    document.getElementById('btn-prev-year').addEventListener('click', () => {
        app.currentYear--;
        document.getElementById('forecast-year').textContent = app.currentYear;
        renderForecast();
    });
    document.getElementById('btn-next-year').addEventListener('click', () => {
        app.currentYear++;
        document.getElementById('forecast-year').textContent = app.currentYear;
        renderForecast();
    });

    // Analytics year navigation
    document.getElementById('btn-prev-analytics-year').addEventListener('click', () => {
        app.currentYear--;
        renderAnalytics();
    });
    document.getElementById('btn-next-analytics-year').addEventListener('click', () => {
        app.currentYear++;
        renderAnalytics();
    });

    // Forecast tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;
            document.getElementById('forecast-income').classList.toggle('hidden', tabName !== 'income');
            document.getElementById('forecast-budgets').classList.toggle('hidden', tabName !== 'budgets');

            if (tabName === 'budgets') {
                renderBudgetTable();
            }
        });
    });

    // Budget month selector
    document.getElementById('budget-month-select').addEventListener('change', renderBudgetTable);

    // Copy budget to all months
    document.getElementById('btn-copy-budget').addEventListener('click', () => {
        const month = document.getElementById('budget-month-select').value;
        dataManager.copyBudgetToYear(app.currentUser, app.currentYear.toString(), month);
        showToast('התקציב הועתק לכל החודשים', 'success');
    });

    // Year and Month dropdowns
    document.getElementById('year-select').addEventListener('change', (e) => {
        app.currentYear = parseInt(e.target.value);
        renderMonthDashboard();
    });
    document.getElementById('month-select').addEventListener('change', (e) => {
        app.currentMonth = e.target.value;
        renderMonthDashboard();
    });

    // Add expense button
    document.getElementById('btn-add-expense').addEventListener('click', () => {
        openExpenseModal();
    });

    // Close expense modal
    document.getElementById('btn-close-expense').addEventListener('click', closeExpenseModal);
    document.getElementById('modal-expense').addEventListener('click', (e) => {
        if (e.target.id === 'modal-expense') closeExpenseModal();
    });

    // Expense form submit
    document.getElementById('expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveExpense();
    });

    // Edit expense modal
    document.getElementById('btn-close-edit-expense').addEventListener('click', closeEditExpenseModal);
    document.getElementById('modal-edit-expense').addEventListener('click', (e) => {
        if (e.target.id === 'modal-edit-expense') closeEditExpenseModal();
    });

    // Edit expense form
    document.getElementById('edit-expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateExpense();
    });

    // Delete expense
    document.getElementById('btn-delete-expense').addEventListener('click', deleteExpense);

    // Category management
    document.getElementById('btn-add-category').addEventListener('click', () => openCategoryModal());
    document.getElementById('btn-close-category').addEventListener('click', closeCategoryModal);
    document.getElementById('modal-category').addEventListener('click', (e) => {
        if (e.target.id === 'modal-category') closeCategoryModal();
    });
    document.getElementById('category-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCategory();
    });

    // Export/Import
    document.getElementById('btn-export-json').addEventListener('click', exportJSON);
    document.getElementById('btn-export-excel').addEventListener('click', exportExcel);
    document.getElementById('import-json').addEventListener('change', importJSON);
    document.getElementById('import-excel').addEventListener('change', importExcel);

    // Installment toggle
    document.getElementById('expense-installment').addEventListener('change', (e) => {
        const options = document.getElementById('installment-options');
        options.classList.toggle('hidden', !e.target.checked);
        if (e.target.checked) {
            updateInstallmentInfo();
        }
    });

    // Update installment info when values change
    document.getElementById('expense-total-amount').addEventListener('input', updateInstallmentInfo);
    document.getElementById('expense-num-payments').addEventListener('input', updateInstallmentInfo);

    // Savings inputs by type
    document.getElementById('savings-bank').addEventListener('change', (e) => {
        const year = app.currentYear.toString();
        const month = app.currentMonth;
        dataManager.setActualSavings(app.currentUser, year, month, 'bank', e.target.value);
        updateSavingsDisplay();
    });

    document.getElementById('savings-pension').addEventListener('change', (e) => {
        const year = app.currentYear.toString();
        const month = app.currentMonth;
        dataManager.setActualSavings(app.currentUser, year, month, 'pension', e.target.value);
        updateSavingsDisplay();
    });

    // Actual income input
    document.getElementById('actual-income-input').addEventListener('change', (e) => {
        const year = app.currentYear.toString();
        const month = app.currentMonth;
        dataManager.setActualIncome(app.currentUser, year, month, e.target.value);
        renderMonthDashboard();
        showToast('הכנסה בפועל עודכנה', 'success');
    });
}

// Set default date for expense form
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

// Select User
function selectUser(userId) {
    if (userId === 'shared') {
        app.currentUser = 'tal'; // Default context
        document.body.className = '';
        showScreen('shared');
        renderSharedView();
        return;
    }

    app.currentUser = userId;

    // Apply theme
    document.body.className = `theme-${userId}`;

    const user = dataManager.getUser(userId);
    document.getElementById('current-user-name').textContent = user.name;
    showScreen('menu');
}

// Show Screen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${screenId}`).classList.add('active');
    app.currentScreen = screenId;
}

// Format number as currency
function formatCurrency(amount) {
    return `₪${Math.round(amount).toLocaleString('he-IL')}`;
}

// ==========================================
// Forecast Screen
// ==========================================

function renderForecast() {
    document.getElementById('forecast-year').textContent = app.currentYear;
    renderIncomeTable();
    populateBudgetMonthSelect();
    renderBudgetTable();
}

function renderIncomeTable() {
    const tbody = document.getElementById('income-table-body');
    tbody.innerHTML = '';

    for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0');
        const forecast = dataManager.getForecast(app.currentUser, app.currentYear.toString(), monthStr);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${MONTH_NAMES[m - 1]}</td>
            <td>
                <input type="number" value="${forecast.income || ''}" 
                       data-month="${monthStr}" data-field="income"
                       placeholder="0" min="0">
            </td>
            <td>
                <input type="number" value="${forecast.plannedSavings || ''}" 
                       data-month="${monthStr}" data-field="savings"
                       placeholder="0" min="0">
            </td>
            <td>
                <button class="btn-copy-income" data-month="${monthStr}" title="העתק לכל השנה">📋</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    // Event listeners for income inputs
    tbody.querySelectorAll('input[data-field="income"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const month = e.target.dataset.month;
            dataManager.setIncome(app.currentUser, app.currentYear.toString(), month, e.target.value);
        });
    });

    // Event listeners for savings inputs
    tbody.querySelectorAll('input[data-field="savings"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const month = e.target.dataset.month;
            dataManager.setPlannedSavings(app.currentUser, app.currentYear.toString(), month, e.target.value);
        });
    });

    // Copy income buttons
    tbody.querySelectorAll('.btn-copy-income').forEach(btn => {
        btn.addEventListener('click', () => {
            const month = btn.dataset.month;
            const forecast = dataManager.getForecast(app.currentUser, app.currentYear.toString(), month);
            for (let m = 1; m <= 12; m++) {
                const monthStr = m.toString().padStart(2, '0');
                dataManager.setIncome(app.currentUser, app.currentYear.toString(), monthStr, forecast.income);
                dataManager.setPlannedSavings(app.currentUser, app.currentYear.toString(), monthStr, forecast.plannedSavings);
            }
            renderIncomeTable();
            showToast('ההכנסה והחיסכון הועתקו לכל החודשים', 'success');
        });
    });
}

function populateBudgetMonthSelect() {
    const select = document.getElementById('budget-month-select');
    select.innerHTML = '';

    for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0');
        const option = document.createElement('option');
        option.value = monthStr;
        option.textContent = MONTH_NAMES[m - 1];
        if (monthStr === app.currentMonth) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

function renderBudgetTable() {
    const month = document.getElementById('budget-month-select').value;
    const categories = dataManager.getCategories(app.currentUser);
    const forecast = dataManager.getForecast(app.currentUser, app.currentYear.toString(), month);

    const tbody = document.getElementById('budget-table-body');
    tbody.innerHTML = '';

    categories.forEach(category => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${category}</td>
            <td>
                <input type="number" value="${forecast.budgets[category] || ''}" 
                       data-category="${category}"
                       placeholder="0" min="0">
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Event listeners
    tbody.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
            const category = e.target.dataset.category;
            dataManager.setBudget(app.currentUser, app.currentYear.toString(), month, category, e.target.value);
        });
    });
}

// ==========================================
// Monthly Dashboard
// ==========================================

function renderMonthDashboard() {
    populateDateSelectors();

    const year = app.currentYear.toString();
    const month = app.currentMonth;

    const forecast = dataManager.getForecast(app.currentUser, year, month);
    const spent = dataManager.getSpentByCategory(app.currentUser, year, month);
    const totalSpent = dataManager.getTotalSpent(app.currentUser, year, month);
    const categories = dataManager.getCategories(app.currentUser);

    // Get deficit from previous month
    const deficit = dataManager.getPreviousMonthDeficit(app.currentUser, year, month);

    // Calculate total budget (original and adjusted)
    const totalBudget = Object.values(forecast.budgets).reduce((sum, v) => sum + (v || 0), 0);
    const totalAdjustedBudget = dataManager.getTotalAdjustedBudget(app.currentUser, year, month);
    const adjustedBudgets = dataManager.getAdjustedBudgets(app.currentUser, year, month);

    // Use adjusted budget for remaining calculation
    const remaining = totalAdjustedBudget - totalSpent;

    // Update summary cards
    document.getElementById('summary-income').textContent = formatCurrency(forecast.income || 0);

    // Show adjusted budget if there's a deficit
    if (deficit > 0) {
        document.getElementById('summary-budget').innerHTML = `
            <span style="text-decoration: line-through; font-size: 0.75em; opacity: 0.6;">${formatCurrency(totalBudget)}</span>
            <br>${formatCurrency(totalAdjustedBudget)}
        `;
    } else {
        document.getElementById('summary-budget').textContent = formatCurrency(totalBudget);
    }

    document.getElementById('summary-spent').textContent = formatCurrency(totalSpent);
    document.getElementById('summary-remaining').textContent = formatCurrency(remaining);

    // Update actual income input
    const actualIncomeInput = document.getElementById('actual-income-input');
    const actualIncomeHint = document.getElementById('actual-income-hint');
    actualIncomeInput.value = forecast.actualIncome !== null ? forecast.actualIncome : '';

    if (forecast.actualIncome !== null && forecast.actualIncome !== forecast.income) {
        const diff = forecast.actualIncome - forecast.income;
        actualIncomeHint.textContent = diff > 0
            ? `(+${formatCurrency(diff)} מהתחזית)`
            : `(${formatCurrency(diff)} מהתחזית)`;
        actualIncomeHint.className = 'actual-income-hint different';
    } else if (forecast.actualIncome === null) {
        actualIncomeHint.textContent = '(משתמש בתחזית)';
        actualIncomeHint.className = 'actual-income-hint';
    } else {
        actualIncomeHint.textContent = '';
        actualIncomeHint.className = 'actual-income-hint';
    }

    // Budget Overrun Alert Logic
    const alertContainer = document.getElementById('overrun-alert-container');
    alertContainer.innerHTML = '';

    if (deficit > 0) {
        let prevYear = parseInt(year);
        let prevMonth = parseInt(month) - 1;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }

        const reductionPercent = Math.round((deficit / totalBudget) * 100);
        const alertDiv = document.createElement('div');
        alertDiv.className = 'overrun-alert';
        alertDiv.innerHTML = `
            <div class="icon">🚨</div>
            <div class="overrun-alert-content">
                <span class="overrun-alert-title">חריגה מחודש ${MONTH_NAMES[prevMonth - 1]}!</span>
                <span class="overrun-alert-desc">חרגת ב-${formatCurrency(deficit)}. התקציב של כל הקטגוריות קוצץ ב-${reductionPercent}% כדי לאזן.</span>
            </div>
        `;
        alertContainer.appendChild(alertDiv);
    }

    // Update remaining card color
    const remainingCard = document.querySelector('.summary-card.remaining');
    remainingCard.classList.toggle('negative', remaining < 0);

    // Render categories progress with adjusted budgets
    const container = document.getElementById('categories-progress');
    container.innerHTML = '';

    categories.forEach(category => {
        const originalBudget = forecast.budgets[category] || 0;
        const adjustedBudget = adjustedBudgets[category] || 0;
        const categorySpent = spent[category] || 0;
        const categoryRemaining = adjustedBudget - categorySpent;
        const percent = adjustedBudget > 0 ? Math.min((categorySpent / adjustedBudget) * 100, 100) : 0;
        const overBudget = categorySpent > adjustedBudget && adjustedBudget > 0;

        const item = document.createElement('div');

        // Budget Alert Classes
        let alertClass = '';
        if (adjustedBudget > 0) {
            const p = (categorySpent / adjustedBudget) * 100;
            if (p >= 100) alertClass = 'over-100';
            else if (p >= 80) alertClass = 'over-80';
        }

        // Show both original and adjusted if different
        let budgetDisplay = formatCurrency(adjustedBudget);
        if (deficit > 0 && originalBudget !== adjustedBudget) {
            budgetDisplay = `<span style="text-decoration: line-through; font-size: 0.9em; opacity: 0.6;">${formatCurrency(originalBudget)}</span> ${formatCurrency(adjustedBudget)}`;
        }

        item.className = `category-item ${alertClass}`;
        item.innerHTML = `
            <div class="category-header">
                <span class="category-name">${category}</span>
                <span class="category-amounts">
                    <span>${formatCurrency(categorySpent)}</span> / ${budgetDisplay}
                    (נותר: <span style="color: ${categoryRemaining < 0 ? 'var(--danger)' : 'var(--success)'}">${formatCurrency(categoryRemaining)}</span>)
                </span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${overBudget ? 'over-budget' : ''}" style="width: ${percent}%"></div>
            </div>
        `;

        item.addEventListener('click', () => showCategoryExpenses(category));
        container.appendChild(item);
    });

    // Populate expense form category dropdown
    populateCategoryDropdown('expense-category');
    populateCategoryDropdown('edit-expense-category');

    // Update savings display
    updateSavingsDisplay();
}

function updateSavingsDisplay() {
    const year = app.currentYear.toString();
    const month = app.currentMonth;

    const forecast = dataManager.getForecast(app.currentUser, year, month);
    const totalSpent = dataManager.getTotalSpent(app.currentUser, year, month);

    // Use effective income (actual if set, otherwise forecast)
    const effectiveIncome = dataManager.getEffectiveIncome(app.currentUser, year, month);

    // Calculate total budget
    const totalBudget = Object.values(forecast.budgets).reduce((sum, v) => sum + (v || 0), 0);

    // Auto-calculate planned savings: income - total budget
    const plannedSavings = Math.max(0, effectiveIncome - totalBudget);

    const actualSavings = dataManager.getActualSavings(app.currentUser, year, month);
    const yearlySavings = dataManager.getYearlySavingsTotals(app.currentUser, year);

    // What should have been saved (income - expenses)
    const potentialSavings = effectiveIncome - totalSpent;

    // Display planned savings (auto-calculated)
    document.getElementById('planned-savings').textContent = formatCurrency(plannedSavings);

    // Set savings input values by type
    document.getElementById('savings-bank').value = actualSavings.bank || '';
    document.getElementById('savings-pension').value = actualSavings.pension || '';

    // Display yearly totals
    document.getElementById('yearly-savings-bank').textContent = `🏦 ${formatCurrency(yearlySavings.bank)}`;
    document.getElementById('yearly-savings-pension').textContent = `📈 ${formatCurrency(yearlySavings.pension)}`;
    document.getElementById('yearly-savings-total').textContent = `סה"כ: ${formatCurrency(yearlySavings.total)}`;

    // Calculate and display difference
    const diffEl = document.getElementById('savings-diff');
    const totalActualSavings = actualSavings.total;

    if (totalActualSavings > 0 || plannedSavings > 0) {
        const planVsActual = totalActualSavings - plannedSavings;
        const lostMoney = potentialSavings - totalActualSavings;

        let html = '';

        // Plan vs actual
        if (planVsActual > 0) {
            html += `✅ חסכת ${formatCurrency(planVsActual)} יותר מהתכנון! `;
        } else if (planVsActual < 0) {
            html += `⚠️ חסרים ${formatCurrency(Math.abs(planVsActual))} מהתכנון. `;
        }

        // Lost money
        if (lostMoney > 0) {
            html += `<br>💸 ${formatCurrency(lostMoney)} "הלכו לאיבוד"`;
            diffEl.className = 'savings-diff negative';
        } else if (lostMoney < 0) {
            html += `<br>🎉 חסכת ${formatCurrency(Math.abs(lostMoney))} יותר ממה שנשאר!`;
            diffEl.className = 'savings-diff positive';
        } else {
            diffEl.className = 'savings-diff neutral';
        }

        diffEl.innerHTML = html;
    } else {
        diffEl.innerHTML = '';
        diffEl.className = 'savings-diff';
    }
}

function populateDateSelectors() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');

    // Populate years (current year ± 2)
    yearSelect.innerHTML = '';
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 2; y >= currentYear - 2; y--) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        option.selected = y === app.currentYear;
        yearSelect.appendChild(option);
    }

    // Populate months (1-12)
    monthSelect.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0');
        const option = document.createElement('option');
        option.value = monthStr;
        option.textContent = MONTH_NAMES[m - 1];
        option.selected = monthStr === app.currentMonth;
        monthSelect.appendChild(option);
    }
}

function populateCategoryDropdown(selectId) {
    const select = document.getElementById(selectId);
    const categories = dataManager.getCategories(app.currentUser);

    select.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

// ==========================================
// Expense Management
// ==========================================

function openExpenseModal() {
    setDefaultDate();
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-note').value = '';
    // Reset installment fields
    document.getElementById('expense-installment').checked = false;
    document.getElementById('installment-options').classList.add('hidden');
    document.getElementById('expense-total-amount').value = '';
    document.getElementById('expense-num-payments').value = '3';
    document.getElementById('installment-info').textContent = '';
    document.getElementById('modal-expense').classList.add('active');
}

function updateInstallmentInfo() {
    const totalAmount = parseFloat(document.getElementById('expense-total-amount').value) || 0;
    const numPayments = parseInt(document.getElementById('expense-num-payments').value) || 1;
    const infoEl = document.getElementById('installment-info');

    if (totalAmount > 0 && numPayments > 1) {
        const perPayment = Math.round(totalAmount / numPayments);
        infoEl.textContent = `${numPayments} תשלומים של ${formatCurrency(perPayment)} כל אחד`;
    } else {
        infoEl.textContent = '';
    }
}

function closeExpenseModal() {
    document.getElementById('modal-expense').classList.remove('active');
}

function saveExpense() {
    const isInstallment = document.getElementById('expense-installment').checked;
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const note = document.getElementById('expense-note').value;

    if (isInstallment) {
        // Handle installment payments
        const totalAmount = parseFloat(document.getElementById('expense-total-amount').value) || 0;
        const numPayments = parseInt(document.getElementById('expense-num-payments').value) || 1;
        const perPayment = Math.round(totalAmount / numPayments);

        const [startYear, startMonth] = date.split('-');
        let currentDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);

        for (let i = 0; i < numPayments; i++) {
            const year = currentDate.getFullYear().toString();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const expenseDate = `${year}-${month}-01`;

            dataManager.addExpense(app.currentUser, year, month, {
                amount: perPayment,
                category,
                date: expenseDate,
                note: note ? `${note} (תשלום ${i + 1}/${numPayments})` : `תשלום ${i + 1}/${numPayments}`
            });

            // Move to next month
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        closeExpenseModal();
        showToast(`נוספו ${numPayments} תשלומים`, 'success');
    } else {
        // Regular single expense
        const amount = document.getElementById('expense-amount').value;
        const [year, month] = date.split('-');

        dataManager.addExpense(app.currentUser, year, month, {
            amount: parseFloat(amount),
            category,
            date,
            note
        });

        closeExpenseModal();
        showToast('ההוצאה נוספה בהצלחה', 'success');
    }

    // Refresh dashboard
    renderMonthDashboard();
}

function showCategoryExpenses(category) {
    const year = app.currentYear.toString();
    const month = app.currentMonth;
    const expenses = dataManager.getExpenses(app.currentUser, year, month)
        .filter(e => e.category === category)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById('expenses-category-title').textContent = category;

    const container = document.getElementById('expenses-list');
    container.innerHTML = '';

    if (expenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">אין הוצאות בקטגוריה זו</p>';
    } else {
        expenses.forEach(expense => {
            const item = document.createElement('div');
            item.className = 'expense-item';
            item.innerHTML = `
                <div class="expense-info">
                    <span class="expense-note">${expense.note || expense.category}</span>
                    <span class="expense-date">${formatDate(expense.date)}</span>
                </div>
                <span class="expense-amount">${formatCurrency(expense.amount)}</span>
            `;
            item.addEventListener('click', () => openEditExpenseModal(expense));
            container.appendChild(item);
        });
    }

    showScreen('expenses-list');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL');
}

function openEditExpenseModal(expense) {
    document.getElementById('edit-expense-id').value = expense.id;
    document.getElementById('edit-expense-amount').value = expense.amount;
    document.getElementById('edit-expense-category').value = expense.category;
    document.getElementById('edit-expense-date').value = expense.date;
    document.getElementById('edit-expense-note').value = expense.note || '';

    document.getElementById('modal-edit-expense').classList.add('active');
}

function closeEditExpenseModal() {
    document.getElementById('modal-edit-expense').classList.remove('active');
}

function updateExpense() {
    const id = document.getElementById('edit-expense-id').value;
    const amount = document.getElementById('edit-expense-amount').value;
    const category = document.getElementById('edit-expense-category').value;
    const date = document.getElementById('edit-expense-date').value;
    const note = document.getElementById('edit-expense-note').value;

    const year = app.currentYear.toString();
    const month = app.currentMonth;

    dataManager.updateExpense(app.currentUser, year, month, id, {
        amount: parseFloat(amount),
        category,
        date,
        note
    });

    closeEditExpenseModal();
    showToast('ההוצאה עודכנה', 'success');

    // Go back to dashboard
    showScreen('month');
    renderMonthDashboard();
}

function deleteExpense() {
    if (!confirm('האם למחוק את ההוצאה?')) return;

    const id = document.getElementById('edit-expense-id').value;
    const year = app.currentYear.toString();
    const month = app.currentMonth;

    dataManager.deleteExpense(app.currentUser, year, month, id);

    closeEditExpenseModal();
    showToast('ההוצאה נמחקה', 'success');

    showScreen('month');
    renderMonthDashboard();
}

// ==========================================
// Categories Management
// ==========================================

function renderCategories() {
    const categories = dataManager.getCategories(app.currentUser);
    const container = document.getElementById('categories-list');
    container.innerHTML = '';

    categories.forEach((category, index) => {
        const item = document.createElement('div');
        item.className = 'category-manage-item';
        item.innerHTML = `
            <span class="category-name">${category}</span>
            <button class="edit" data-index="${index}" title="ערוך">✏️</button>
            <button class="delete" data-index="${index}" title="מחק">🗑️</button>
        `;
        container.appendChild(item);
    });

    // Edit buttons
    container.querySelectorAll('.edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            openCategoryModal(index, categories[index]);
        });
    });

    // Delete buttons
    container.querySelectorAll('.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            if (confirm(`האם למחוק את הקטגוריה "${categories[index]}"?`)) {
                dataManager.deleteCategory(app.currentUser, index);
                renderCategories();
                showToast('הקטגוריה נמחקה', 'success');
            }
        });
    });
}

function openCategoryModal(index = null, name = '') {
    document.getElementById('category-modal-title').textContent = index !== null ? 'עריכת קטגוריה' : 'הוספת קטגוריה';
    document.getElementById('category-edit-index').value = index !== null ? index : '';
    document.getElementById('category-name').value = name;
    document.getElementById('modal-category').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('modal-category').classList.remove('active');
}

function saveCategory() {
    const index = document.getElementById('category-edit-index').value;
    const name = document.getElementById('category-name').value.trim();

    if (!name) return;

    if (index !== '') {
        dataManager.updateCategory(app.currentUser, parseInt(index), name);
        showToast('הקטגוריה עודכנה', 'success');
    } else {
        dataManager.addCategory(app.currentUser, name);
        showToast('הקטגוריה נוספה', 'success');
    }

    closeCategoryModal();
    renderCategories();
}

// ==========================================
// Statistics
// ==========================================

function renderStats() {
    const categories = dataManager.getCategories(app.currentUser);
    const user = dataManager.getUser(app.currentUser);

    // Calculate yearly totals
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const year in user.forecasts) {
        for (const month in user.forecasts[year]) {
            totalIncome += user.forecasts[year][month].income || 0;
        }
    }

    for (const monthKey in user.expenses) {
        user.expenses[monthKey].forEach(e => {
            totalExpenses += parseFloat(e.amount) || 0;
        });
    }

    // Summary grid
    const summaryGrid = document.getElementById('stats-summary-grid');
    summaryGrid.innerHTML = `
        <div class="stat-card">
            <span class="stat-label">סה"כ הכנסות (תחזית)</span>
            <span class="stat-value">${formatCurrency(totalIncome)}</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">סה"כ הוצאות</span>
            <span class="stat-value" style="color: var(--warning)">${formatCurrency(totalExpenses)}</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">יתרה</span>
            <span class="stat-value" style="color: ${totalIncome - totalExpenses >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatCurrency(totalIncome - totalExpenses)}</span>
        </div>
        <div class="stat-card">
            <span class="stat-label">חודשים עם נתונים</span>
            <span class="stat-value">${Object.keys(user.expenses).length}</span>
        </div>
    `;

    // Categories table
    const tbody = document.getElementById('stats-table-body');
    tbody.innerHTML = '';

    categories.forEach(category => {
        const stats = dataManager.getCategoryStats(app.currentUser, category);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${category}</td>
            <td>${formatCurrency(stats.average)}</td>
            <td>${formatCurrency(stats.median)}</td>
            <td>${formatCurrency(stats.total)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// Export/Import
// ==========================================

function exportJSON() {
    const data = dataManager.exportJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('הנתונים יוצאו בהצלחה', 'success');
}

function exportExcel() {
    try {
        ExcelManager.exportToExcel(app.currentUser);
        showToast('הקובץ הורד בהצלחה', 'success');
    } catch (e) {
        showToast('שגיאה בייצוא', 'error');
        console.error(e);
    }
}

async function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (dataManager.importJSON(event.target.result)) {
            showToast('הנתונים יובאו בהצלחה', 'success');
            // Refresh current view
            showScreen('menu');
        } else {
            showToast('שגיאה בייבוא הנתונים', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

async function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const result = await ExcelManager.importFromExcel(app.currentUser, file);
        showToast(`יובאו: ${result.expenses} הוצאות, ${result.categories} קטגוריות`, 'success');
        renderMonthDashboard();
    } catch (error) {
        showToast('שגיאה בייבוא Excel', 'error');
        console.error(error);
    }
    e.target.value = ''; // Reset input
}

// ==========================================
// Toast Notifications
// ==========================================

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// Analytics
// ==========================================

// Store chart instances to destroy before recreating
let charts = {};

function renderAnalytics() {
    const year = app.currentYear.toString();
    document.getElementById('analytics-year').textContent = year;

    const user = dataManager.getUser(app.currentUser);
    const categories = dataManager.getCategories(app.currentUser);

    // Collect monthly data
    const monthlyData = [];
    let worstOverrunMonth = { month: '', amount: 0 };
    let bestSavingsMonth = { month: '', savings: 0, efficiency: 0 };
    let worstLostMonth = { month: '', amount: 0 };
    let goalsMetCount = 0;
    const categoryOverruns = {};

    for (let m = 1; m <= 12; m++) {
        const month = m.toString().padStart(2, '0');
        const forecast = dataManager.getForecast(app.currentUser, year, month);
        const totalSpent = dataManager.getTotalSpent(app.currentUser, year, month);
        const savings = dataManager.getActualSavings(app.currentUser, year, month);
        const spent = dataManager.getSpentByCategory(app.currentUser, year, month);

        const income = forecast.income || 0;
        const plannedSavings = forecast.plannedSavings || 0;
        const totalBudget = Object.values(forecast.budgets).reduce((sum, v) => sum + (v || 0), 0);
        const budgetOverrun = totalSpent - totalBudget;
        const potentialSavings = income - totalSpent;
        const lostMoney = potentialSavings - savings.total;

        if (savings.total >= plannedSavings && plannedSavings > 0) {
            goalsMetCount++;
        }

        monthlyData.push({
            month: MONTH_NAMES[m - 1],
            income,
            spent: totalSpent,
            budget: totalBudget,
            overrun: budgetOverrun,
            savings: savings.total,
            plannedSavings: plannedSavings,
            bank: savings.bank,
            pension: savings.pension,
            lostMoney
        });

        // Track worst overrun month
        if (budgetOverrun > worstOverrunMonth.amount && totalBudget > 0) {
            worstOverrunMonth = { month: MONTH_NAMES[m - 1], amount: budgetOverrun };
        }

        // Track best savings efficiency
        if (income > 0 && savings.total > 0) {
            const efficiency = (savings.total / income) * 100;
            if (efficiency > bestSavingsMonth.efficiency) {
                bestSavingsMonth = { month: MONTH_NAMES[m - 1], savings: savings.total, efficiency };
            }
        }

        // Track worst lost money month
        if (lostMoney > worstLostMonth.amount && income > 0) {
            worstLostMonth = { month: MONTH_NAMES[m - 1], amount: lostMoney };
        }

        // Track category overruns
        categories.forEach(category => {
            const categoryBudget = forecast.budgets[category] || 0;
            const categorySpent = spent[category] || 0;
            if (categorySpent > categoryBudget && categoryBudget > 0) {
                if (!categoryOverruns[category]) categoryOverruns[category] = 0;
                categoryOverruns[category] += categorySpent - categoryBudget;
            }
        });
    }

    // Find worst category
    let worstCategory = { name: 'אין', amount: 0 };
    for (const [cat, amount] of Object.entries(categoryOverruns)) {
        if (amount > worstCategory.amount) {
            worstCategory = { name: cat, amount };
        }
    }

    // Calculate yearly totals
    const yearlyIncome = monthlyData.reduce((sum, d) => sum + d.income, 0);
    const yearlySpent = monthlyData.reduce((sum, d) => sum + d.spent, 0);
    const yearlySavings = monthlyData.reduce((sum, d) => sum + d.savings, 0);
    const yearlyLost = monthlyData.reduce((sum, d) => sum + Math.max(0, d.lostMoney), 0);

    // Render insights
    const insightsGrid = document.getElementById('insights-grid');
    insightsGrid.innerHTML = `
        <div class="insight-card ${worstOverrunMonth.amount > 0 ? 'negative' : 'positive'}">
            <div class="insight-icon">${worstOverrunMonth.amount > 0 ? '🚨' : '✅'}</div>
            <div class="insight-title">חריגה הגדולה ביותר</div>
            <div class="insight-value">${worstOverrunMonth.amount > 0 ? worstOverrunMonth.month : 'אין חריגות!'}</div>
            <div class="insight-subtitle">${worstOverrunMonth.amount > 0 ? formatCurrency(worstOverrunMonth.amount) : ''}</div>
        </div>
        
        <div class="insight-card warning">
            <div class="insight-icon">🏷️</div>
            <div class="insight-title">קטגוריה בעייתית</div>
            <div class="insight-value">${worstCategory.name}</div>
            <div class="insight-subtitle">${worstCategory.amount > 0 ? formatCurrency(worstCategory.amount) + ' חריגה' : 'הכל בסדר'}</div>
        </div>

        <div class="insight-card ${goalsMetCount >= 6 ? 'positive' : 'warning'}">
            <div class="insight-icon">🎯</div>
            <div class="insight-title">עמידה ביעד חיסכון</div>
            <div class="insight-value">${goalsMetCount}/12 חודשים</div>
            <div class="insight-subtitle">עמידה ביעד שהוגדר</div>
        </div>
        
        <div class="insight-card ${bestSavingsMonth.savings > 0 ? 'positive' : 'info'}">
            <div class="insight-icon">🏆</div>
            <div class="insight-title">חודש החיסכון הטוב</div>
            <div class="insight-value">${bestSavingsMonth.savings > 0 ? bestSavingsMonth.month : 'אין נתונים'}</div>
            <div class="insight-subtitle">${bestSavingsMonth.savings > 0 ? Math.round(bestSavingsMonth.efficiency) + '% מההכנסה' : ''}</div>
        </div>
        
        <div class="insight-card ${worstLostMonth.amount > 0 ? 'negative' : 'positive'}">
            <div class="insight-icon">${worstLostMonth.amount > 0 ? '💸' : '🎉'}</div>
            <div class="insight-title">כסף שנעלם</div>
            <div class="insight-value">${worstLostMonth.amount > 0 ? worstLostMonth.month : 'אין!'}</div>
            <div class="insight-subtitle">${worstLostMonth.amount > 0 ? formatCurrency(worstLostMonth.amount) : 'כל השקל מתועד'}</div>
        </div>
        
        <div class="insight-card info">
            <div class="insight-icon">💰</div>
            <div class="insight-title">סה"כ חיסכון שנתי</div>
            <div class="insight-value">${formatCurrency(yearlySavings)}</div>
            <div class="insight-subtitle">${yearlyIncome > 0 ? Math.round((yearlySavings / yearlyIncome) * 100) + '% מההכנסות' : ''}</div>
        </div>
        
        <div class="insight-card ${yearlyLost > 0 ? 'negative' : 'positive'}">
            <div class="insight-icon">${yearlyLost > 0 ? '⚠️' : '✨'}</div>
            <div class="insight-title">סה"כ כסף לא מתועד</div>
            <div class="insight-value">${formatCurrency(yearlyLost)}</div>
            <div class="insight-subtitle">${yearlyIncome > 0 ? Math.round((yearlyLost / yearlyIncome) * 100) + '% מההכנסות' : ''}</div>
        </div>
    `;

    // Destroy existing charts
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};

    // Chart 1: Income vs Expenses
    const ctx1 = document.getElementById('income-expense-chart').getContext('2d');
    charts.incomeExpense = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [
                {
                    label: 'הכנסה',
                    data: monthlyData.map(d => d.income),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'הוצאות',
                    data: monthlyData.map(d => d.spent),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top', rtl: true } }
        }
    });

    // Chart 2: Savings by type
    const ctx2 = document.getElementById('savings-chart').getContext('2d');
    charts.savings = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [
                {
                    label: '🏦 בנק',
                    data: monthlyData.map(d => d.bank),
                    backgroundColor: '#6366F1'
                },
                {
                    label: '📈 קופת גמל',
                    data: monthlyData.map(d => d.pension),
                    backgroundColor: '#8B5CF6'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top', rtl: true } },
            scales: { x: { stacked: true }, y: { stacked: true } }
        }
    });

    // Chart 3: Category overruns
    const categoryNames = Object.keys(categoryOverruns);
    const categoryAmounts = Object.values(categoryOverruns);

    const ctx3 = document.getElementById('category-overrun-chart').getContext('2d');
    charts.categoryOverrun = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: categoryNames.length > 0 ? categoryNames : ['אין חריגות'],
            datasets: [{
                data: categoryAmounts.length > 0 ? categoryAmounts : [1],
                backgroundColor: categoryNames.length > 0
                    ? ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#EC4899']
                    : ['#10B981']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'right', rtl: true } }
        }
    });

    // Chart 4: Savings Goals (Target vs Actual)
    const ctx4 = document.getElementById('savings-goals-chart').getContext('2d');
    charts.savingsGoals = new Chart(ctx4, {
        type: 'bar',
        data: {
            labels: monthlyData.map(d => d.month),
            datasets: [
                {
                    label: 'חיסכון בפועל (סה"כ)',
                    data: monthlyData.map(d => d.savings),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10B981',
                    borderWidth: 1
                },
                {
                    label: 'יעד חיסכון',
                    data: monthlyData.map(d => d.plannedSavings),
                    type: 'line',
                    borderColor: '#EF4444',
                    borderDash: [5, 5],
                    fill: false,
                    pointStyle: 'circle',
                    pointRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top', rtl: true } }
        }
    });

    // Chart 5: User Comparison (Tal vs Ron)
    const talData = [];
    const ronData = [];
    for (let m = 1; m <= 12; m++) {
        const month = m.toString().padStart(2, '0');
        talData.push(dataManager.getTotalSpent('tal', year, month));
        ronData.push(dataManager.getTotalSpent('ron', year, month));
    }

    const ctx5 = document.getElementById('user-comparison-chart').getContext('2d');
    charts.userComparison = new Chart(ctx5, {
        type: 'bar',
        data: {
            labels: MONTH_NAMES,
            datasets: [
                {
                    label: 'טל',
                    data: talData,
                    backgroundColor: '#6366F1'
                },
                {
                    label: 'רון',
                    data: ronData,
                    backgroundColor: '#EC4899'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top', rtl: true } }
        }
    });
}
// ==========================================
// History & Search
// ==========================================
function renderHistory() {
    const searchTerm = document.getElementById('history-search').value.toLowerCase();
    const categoryFilter = document.getElementById('history-filter-category').value;
    const userFilter = document.getElementById('history-filter-user').value;

    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = '';

    // Populate category filter if empty
    const catSelect = document.getElementById('history-filter-category');
    if (catSelect.options.length === 0) {
        catSelect.innerHTML = '<option value="all">כל הקטגוריות</option>';
        dataManager.getCategories(app.currentUser).forEach(cat => {
            catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }

    const usersToSearch = userFilter === 'all' ? ['tal', 'ron'] : [app.currentUser];
    let allTransactions = [];

    usersToSearch.forEach(uId => {
        const user = dataManager.getUser(uId);
        const userName = user.name;

        for (const monthKey in user.expenses) {
            user.expenses[monthKey].forEach(exp => {
                if (
                    (searchTerm === '' || exp.note.toLowerCase().includes(searchTerm) || exp.amount.toString().includes(searchTerm)) &&
                    (categoryFilter === 'all' || exp.category === categoryFilter)
                ) {
                    allTransactions.push({ ...exp, userName, monthKey });
                }
            });
        }
    });

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    allTransactions.forEach(tx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.category}</td>
            <td>${tx.note} ${userFilter === 'all' ? `(${tx.userName})` : ''}</td>
            <td>${formatCurrency(tx.amount)}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==========================================
// Wishlist
// ==========================================
function renderWishlist() {
    const grid = document.getElementById('wishlist-grid');
    const goals = dataManager.getWishlist(app.currentUser);
    grid.innerHTML = '';

    goals.forEach(goal => {
        const percent = (goal.savedAmount / goal.targetAmount) * 100;

        // Estimate time (simple: based on last year's average savings)
        const yearlySavings = dataManager.getYearlySavingsTotals(app.currentUser, app.currentYear.toString());
        const avgMonthlySavings = yearlySavings.total / 12 || 1000;
        const remaining = goal.targetAmount - goal.savedAmount;
        const monthsLeft = Math.ceil(remaining / avgMonthlySavings);

        const card = document.createElement('div');
        card.className = 'wishlist-card';
        card.innerHTML = `
            <div class="goal-header">
                <span class="goal-name">${goal.name}</span>
                <button class="btn-icon" onclick="deleteWishlistGoal('${goal.id}')">🗑️</button>
            </div>
            <div class="goal-progress-container">
                <div class="goal-progress-bar" style="width: ${Math.min(percent, 100)}%"></div>
            </div>
            <div class="goal-stats">
                <span>נחסך: ${formatCurrency(goal.savedAmount)}</span>
                <span>יעד: ${formatCurrency(goal.targetAmount)}</span>
            </div>
            <div class="goal-eta">
                ${percent >= 100 ? '✅ הושלם!' : `⏳ עוד כ-${monthsLeft} חודשים (לפי קצב נוכחי)`}
            </div>
        `;
        grid.appendChild(card);
    });
}

function openWishlistModal() {
    document.getElementById('modal-wishlist').style.display = 'flex';
}

function closeWishlistModal() {
    document.getElementById('modal-wishlist').style.display = 'none';
}

function saveWishlistGoal() {
    const goal = {
        name: document.getElementById('wishlist-name').value,
        targetAmount: parseFloat(document.getElementById('wishlist-amount').value),
        savedAmount: parseFloat(document.getElementById('wishlist-saved').value) || 0,
        note: document.getElementById('wishlist-note').value
    };
    dataManager.addWishlistGoal(app.currentUser, goal);
    closeWishlistModal();
    renderWishlist();
    showToast('יעד רכישה נוסף!', 'success');
}

window.deleteWishlistGoal = function (id) {
    if (confirm('בטוח רוצה למחוק את היעד?')) {
        dataManager.deleteWishlistGoal(app.currentUser, id);
        renderWishlist();
    }
}

// ==========================================
// Recurring
// ==========================================
function openRecurringModal() {
    document.getElementById('modal-recurring').style.display = 'flex';
    renderRecurringList();

    // Fill categories
    const select = document.getElementById('recurring-category');
    select.innerHTML = '';
    dataManager.getCategories(app.currentUser).forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function closeRecurringModal() {
    document.getElementById('modal-recurring').style.display = 'none';
}

function renderRecurringList() {
    const container = document.getElementById('recurring-list-container');
    const expenses = dataManager.getRecurringExpenses(app.currentUser);
    container.innerHTML = '';

    expenses.forEach(exp => {
        const div = document.createElement('div');
        div.className = 'recurring-item';
        div.innerHTML = `
            <span><strong>${exp.category}:</strong> ${formatCurrency(exp.amount)} (${exp.note})</span>
            <button class="btn-icon" onclick="deleteRecurring('${exp.id}')">🗑️</button>
        `;
        container.appendChild(div);
    });
}

function saveRecurringTemplate() {
    const expense = {
        category: document.getElementById('recurring-category').value,
        amount: parseFloat(document.getElementById('recurring-amount').value),
        note: document.getElementById('recurring-note').value
    };
    dataManager.addRecurringExpense(app.currentUser, expense);
    renderRecurringList();
    document.getElementById('recurring-amount').value = '';
    document.getElementById('recurring-note').value = '';
}

window.deleteRecurring = function (id) {
    dataManager.deleteRecurringExpense(app.currentUser, id);
    renderRecurringList();
}

function applyRecurring() {
    const year = app.currentYear.toString();
    const month = app.currentMonth;
    const count = dataManager.applyRecurringToMonth(app.currentUser, year, month);
    if (count > 0) {
        showToast(`${count} הוצאות קבועות נוספו לחודש זה`, 'success');
        renderMonthDashboard();
    } else {
        showToast('אין הוצאות קבועות מוגדרות', 'info');
    }
}
// ==========================================
// Unified Household Dashboard (Shared View)
// ==========================================
function renderSharedView() {
    populateSharedDateSelectors();

    const year = app.currentYear.toString();
    const month = app.currentMonth;

    // 1. Get data for both users
    const talForecast = dataManager.getForecast('tal', year, month);
    const ronForecast = dataManager.getForecast('ron', year, month);
    const talExpenses = dataManager.getExpenses('tal', year, month);
    const ronExpenses = dataManager.getExpenses('ron', year, month);

    // 2. Combined Summary Calculations
    const combinedIncome = (talForecast.income || 0) + (ronForecast.income || 0);
    const talBudget = Object.values(talForecast.budgets).reduce((sum, v) => sum + (v || 0), 0);
    const ronBudget = Object.values(ronForecast.budgets).reduce((sum, v) => sum + (v || 0), 0);
    const combinedBudget = talBudget + ronBudget;

    const talSpent = talExpenses.reduce((sum, e) => sum + e.amount, 0);
    const ronSpent = ronExpenses.reduce((sum, e) => sum + e.amount, 0);
    const combinedSpent = talSpent + ronSpent;
    const combinedRemaining = combinedBudget - combinedSpent;

    // Update Summary Cards
    document.getElementById('shared-summary-income').textContent = formatCurrency(combinedIncome);
    document.getElementById('shared-summary-budget').textContent = formatCurrency(combinedBudget);
    document.getElementById('shared-summary-spent').textContent = formatCurrency(combinedSpent);
    document.getElementById('shared-summary-remaining').textContent = formatCurrency(combinedRemaining);

    const remainingCard = document.querySelector('#screen-shared .summary-card.remaining');
    if (remainingCard) remainingCard.classList.toggle('negative', combinedRemaining < 0);

    // 3. Category Comparison Table
    const talCategories = dataManager.getCategories('tal');
    const ronCategories = dataManager.getCategories('ron');
    const allCategories = [...new Set([...talCategories, ...ronCategories])].sort();

    // Aggregate by category
    const talByCategory = {};
    talExpenses.forEach(e => { talByCategory[e.category] = (talByCategory[e.category] || 0) + e.amount; });
    const ronByCategory = {};
    ronExpenses.forEach(e => { ronByCategory[e.category] = (ronByCategory[e.category] || 0) + e.amount; });

    const tbody = document.getElementById('shared-comparison-table-body');
    tbody.innerHTML = '';

    allCategories.forEach(cat => {
        const talAmt = talByCategory[cat] || 0;
        const ronAmt = ronByCategory[cat] || 0;

        // Only show categories that have expenses this month
        if (talAmt === 0 && ronAmt === 0) return;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat}</td>
            <td>${formatCurrency(talAmt)}</td>
            <td>${formatCurrency(ronAmt)}</td>
            <td style="font-weight: 700; color: var(--accent-primary);">${formatCurrency(talAmt + ronAmt)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update Totals row in tfoot
    document.getElementById('shared-total-tal').textContent = formatCurrency(talSpent);
    document.getElementById('shared-total-ron').textContent = formatCurrency(ronSpent);
    document.getElementById('shared-total-combined').textContent = formatCurrency(combinedSpent);

    // 4. Shared Chart
    renderSharedChart(talSpent, ronSpent);
}

function renderSharedChart(talSpent, ronSpent) {
    const canvas = document.getElementById('shared-expenses-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (charts.sharedExpenses) charts.sharedExpenses.destroy();

    // Handle $0/$0 case
    if (talSpent === 0 && ronSpent === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.font = '16px Heebo';
        ctx.fillText('אין נתונים להצגה בחודש זה', canvas.width / 2, canvas.height / 2);
        return;
    }

    charts.sharedExpenses = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['טל 💖', 'רון 💙'],
            datasets: [{
                data: [talSpent, ronSpent],
                backgroundColor: ['#ec4899', '#3b82f6'],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff', font: { family: 'Heebo', size: 14 } }
                }
            }
        }
    });
}

function populateSharedDateSelectors() {
    const yearSelect = document.getElementById('shared-year-select');
    const monthSelect = document.getElementById('shared-month-select');

    if (yearSelect.options.length === 0) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear + 2; y >= currentYear - 2; y--) {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        }
    }
    yearSelect.value = app.currentYear;

    if (monthSelect.options.length === 0) {
        for (let m = 1; m <= 12; m++) {
            const monthStr = m.toString().padStart(2, '0');
            const option = document.createElement('option');
            option.value = monthStr;
            option.textContent = MONTH_NAMES[m - 1];
            monthSelect.appendChild(option);
        }
    }
    monthSelect.value = app.currentMonth;
}
