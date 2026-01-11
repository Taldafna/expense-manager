/**
 * Data Layer - Manages all data storage and retrieval
 * Uses LocalStorage for persistence
 */

const DATA_KEY = 'expense_manager_data';

// Hebrew month names
const MONTH_NAMES = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

// Default categories for each user
const DEFAULT_CATEGORIES = {
    tal: [
        'הוצאות קבועות',
        'הזמנת אוכל לשתינו',
        'הזמנת אוכל לעצמי',
        'יציאות עם חברים',
        'קניות על הדרך (סופר / מאפיה / קפה)',
        'גבות',
        'טיפוח - בגדים ונעליים / הזמנות אונליין / סופר פארם',
        'דלק',
        'חתונות',
        'אחר',
        'לימודים',
        'טיפולי אקנה ושיער',
        'לק ג\'ל',
        'מתנות משפחה',
        'צימר'
    ],
    ron: [
        'הוצאות קבועות',
        'מוסך רכב - תיקון וטיפול',
        'הזמנת אוכל לשתינו',
        'הזמנת אוכל לעצמי',
        'יציאות עם חברים',
        'קניות על הדרך (סופר / מאפיה / קפה)',
        'ספר',
        'סיגריות',
        'פנגו / כביש 6',
        'חניונים',
        'חומרי ניקוי לרכב או שטיפה בחוץ',
        'דלק',
        'טיפוח - בגדים ונעליים / הזמנות אונליין',
        'סופר פארם / תרופות',
        'צימר',
        'חתונות',
        'אחר'
    ]
};

// Initial data structure
function getDefaultData() {
    return {
        users: {
            tal: {
                name: 'טל',
                categories: [...DEFAULT_CATEGORIES.tal],
                forecasts: {},
                expenses: {},
                savings: {}, // {"2026-01": amount}
                recurringExpenses: [], // [{id, category, amount, note}]
                wishlist: [] // [{id, name, targetAmount, savedAmount, note}]
            },
            ron: {
                name: 'רון',
                categories: [...DEFAULT_CATEGORIES.ron],
                forecasts: {},
                expenses: {},
                savings: {}, // {"2026-01": amount}
                recurringExpenses: [],
                wishlist: []
            }
        }
    };
}

// Data Manager Class
class DataManager {
    constructor() {
        this.data = this.loadData();
    }

    // Load data from LocalStorage
    loadData() {
        try {
            const saved = localStorage.getItem(DATA_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
        return getDefaultData();
    }

    // Save data to LocalStorage
    saveData() {
        try {
            localStorage.setItem(DATA_KEY, JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
        }
    }

    // Get user data
    getUser(userId) {
        return this.data.users[userId];
    }

    // Get categories for a user
    getCategories(userId) {
        return this.data.users[userId]?.categories || [];
    }

    // Add category
    addCategory(userId, categoryName) {
        const user = this.data.users[userId];
        if (user && !user.categories.includes(categoryName)) {
            user.categories.push(categoryName);
            this.saveData();
            return true;
        }
        return false;
    }

    // Update category
    updateCategory(userId, index, newName) {
        const user = this.data.users[userId];
        if (user && index >= 0 && index < user.categories.length) {
            const oldName = user.categories[index];
            user.categories[index] = newName;

            // Update all expenses and budgets with the new category name
            this.updateCategoryReferences(userId, oldName, newName);
            this.saveData();
            return true;
        }
        return false;
    }

    // Delete category
    deleteCategory(userId, index) {
        const user = this.data.users[userId];
        if (user && index >= 0 && index < user.categories.length) {
            user.categories.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // Update category references in expenses and budgets
    updateCategoryReferences(userId, oldName, newName) {
        const user = this.data.users[userId];

        // Update expenses
        for (const monthKey in user.expenses) {
            user.expenses[monthKey].forEach(expense => {
                if (expense.category === oldName) {
                    expense.category = newName;
                }
            });
        }

        // Update budgets in forecasts
        for (const year in user.forecasts) {
            for (const month in user.forecasts[year]) {
                const budget = user.forecasts[year][month].budgets;
                if (budget && budget[oldName] !== undefined) {
                    budget[newName] = budget[oldName];
                    delete budget[oldName];
                }
            }
        }
    }

    // Get forecast for a specific year and month
    getForecast(userId, year, month) {
        const user = this.data.users[userId];
        if (!user.forecasts[year]) {
            user.forecasts[year] = {};
        }
        if (!user.forecasts[year][month]) {
            user.forecasts[year][month] = {
                income: 0,
                actualIncome: null,
                plannedSavings: 0,
                budgets: {}
            };
        }
        // Ensure plannedSavings exists for older data
        if (user.forecasts[year][month].plannedSavings === undefined) {
            user.forecasts[year][month].plannedSavings = 0;
        }
        // Ensure actualIncome exists for older data (null means use forecast)
        if (user.forecasts[year][month].actualIncome === undefined) {
            user.forecasts[year][month].actualIncome = null;
        }
        return user.forecasts[year][month];
    }

    // Set income forecast
    setIncome(userId, year, month, amount) {
        const forecast = this.getForecast(userId, year, month);
        forecast.income = parseFloat(amount) || 0;
        this.saveData();
    }

    // Set actual income for a month
    setActualIncome(userId, year, month, amount) {
        const forecast = this.getForecast(userId, year, month);
        // If empty or null, set to null (use forecast)
        const parsed = parseFloat(amount);
        forecast.actualIncome = isNaN(parsed) || amount === '' ? null : parsed;
        this.saveData();
    }

    // Get effective income (actual if set, otherwise forecast)
    getEffectiveIncome(userId, year, month) {
        const forecast = this.getForecast(userId, year, month);
        return forecast.actualIncome !== null ? forecast.actualIncome : forecast.income;
    }

    // Get previous month deficit (if overspent)
    getPreviousMonthDeficit(userId, year, month) {
        let prevYear = parseInt(year);
        let prevMonth = parseInt(month) - 1;
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        const prevMonthStr = prevMonth.toString().padStart(2, '0');
        const prevYearStr = prevYear.toString();

        const prevForecast = this.getForecast(userId, prevYearStr, prevMonthStr);
        const prevSpent = this.getTotalSpent(userId, prevYearStr, prevMonthStr);
        const prevBudget = Object.values(prevForecast.budgets).reduce((sum, v) => sum + (v || 0), 0);

        if (prevSpent > prevBudget && prevBudget > 0) {
            return prevSpent - prevBudget;
        }
        return 0;
    }

    // Get income reduction ratio (if actual income < forecast income)
    getIncomeReductionRatio(userId, year, month) {
        const forecast = this.getForecast(userId, year, month);
        const forecastIncome = forecast.income || 0;
        const actualIncome = forecast.actualIncome;

        // If no actual income set or actual >= forecast, no reduction
        if (actualIncome === null || forecastIncome === 0 || actualIncome >= forecastIncome) {
            return 0;
        }

        // Calculate reduction ratio
        return (forecastIncome - actualIncome) / forecastIncome;
    }

    // Get adjusted budget for a category (based on income difference)
    getAdjustedBudget(userId, year, month, category) {
        const forecast = this.getForecast(userId, year, month);
        const originalBudget = forecast.budgets[category] || 0;

        if (originalBudget === 0) return 0;

        const reductionRatio = this.getIncomeReductionRatio(userId, year, month);
        if (reductionRatio === 0) return originalBudget;

        // Reduce proportionally
        const reduction = originalBudget * reductionRatio;
        return Math.max(0, originalBudget - reduction);
    }

    // Get all adjusted budgets for a month
    getAdjustedBudgets(userId, year, month) {
        const forecast = this.getForecast(userId, year, month);
        const categories = this.getCategories(userId);
        const adjustedBudgets = {};

        categories.forEach(category => {
            adjustedBudgets[category] = this.getAdjustedBudget(userId, year, month, category);
        });

        return adjustedBudgets;
    }

    // Get total adjusted budget for a month
    getTotalAdjustedBudget(userId, year, month) {
        const adjustedBudgets = this.getAdjustedBudgets(userId, year, month);
        return Object.values(adjustedBudgets).reduce((sum, v) => sum + (v || 0), 0);
    }

    // Set budget for a category
    setBudget(userId, year, month, category, amount) {
        const forecast = this.getForecast(userId, year, month);
        forecast.budgets[category] = parseFloat(amount) || 0;
        this.saveData();
    }

    // Set planned savings forecast
    setPlannedSavings(userId, year, month, amount) {
        const forecast = this.getForecast(userId, year, month);
        forecast.plannedSavings = parseFloat(amount) || 0;
        this.saveData();
    }

    // Get actual savings for a month (by type or total)
    getActualSavings(userId, year, month, type = null) {
        const user = this.data.users[userId];
        if (!user.savings) user.savings = {};
        const key = `${year}-${month}`;

        if (!user.savings[key]) {
            return type ? 0 : { bank: 0, pension: 0, total: 0 };
        }

        const savings = user.savings[key];

        // Handle old format (just a number)
        if (typeof savings === 'number') {
            if (type) return type === 'bank' ? savings : 0;
            return { bank: savings, pension: 0, total: savings };
        }

        // New format with types
        if (type) {
            return savings[type] || 0;
        }

        const bank = savings.bank || 0;
        const pension = savings.pension || 0;
        return { bank, pension, total: bank + pension };
    }

    // Set actual savings for a month by type
    setActualSavings(userId, year, month, type, amount) {
        const user = this.data.users[userId];
        if (!user.savings) user.savings = {};
        const key = `${year}-${month}`;

        // Initialize or convert old format
        if (!user.savings[key] || typeof user.savings[key] === 'number') {
            const oldValue = typeof user.savings[key] === 'number' ? user.savings[key] : 0;
            user.savings[key] = { bank: oldValue, pension: 0 };
        }

        user.savings[key][type] = parseFloat(amount) || 0;
        this.saveData();
    }

    // Get yearly savings totals
    getYearlySavingsTotals(userId, year) {
        const user = this.data.users[userId];
        if (!user.savings) return { bank: 0, pension: 0, total: 0 };

        let bankTotal = 0;
        let pensionTotal = 0;

        for (let m = 1; m <= 12; m++) {
            const month = m.toString().padStart(2, '0');
            const savings = this.getActualSavings(userId, year, month);
            bankTotal += savings.bank;
            pensionTotal += savings.pension;
        }

        return { bank: bankTotal, pension: pensionTotal, total: bankTotal + pensionTotal };
    }

    // Copy budget from one month to all months in the year
    copyBudgetToYear(userId, year, sourceMonth) {
        const sourceForecast = this.getForecast(userId, year, sourceMonth);
        for (let m = 1; m <= 12; m++) {
            const monthStr = m.toString().padStart(2, '0');
            if (monthStr !== sourceMonth) {
                const targetForecast = this.getForecast(userId, year, monthStr);
                targetForecast.budgets = { ...sourceForecast.budgets };
            }
        }
        this.saveData();
    }

    // Get expenses for a month
    getExpenses(userId, year, month) {
        const user = this.data.users[userId];
        const key = `${year}-${month}`;
        if (!user.expenses[key]) {
            user.expenses[key] = [];
        }
        return user.expenses[key];
    }

    // Add expense
    addExpense(userId, year, month, expense) {
        const expenses = this.getExpenses(userId, year, month);
        expense.id = Date.now().toString();
        expenses.push(expense);
        this.saveData();
        return expense.id;
    }

    // Update expense
    updateExpense(userId, year, month, expenseId, updatedExpense) {
        const expenses = this.getExpenses(userId, year, month);
        const index = expenses.findIndex(e => e.id === expenseId);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updatedExpense };
            this.saveData();
            return true;
        }
        return false;
    }

    // Delete expense
    deleteExpense(userId, year, month, expenseId) {
        const user = this.data.users[userId];
        const key = `${year}-${month}`;
        if (user.expenses[key]) {
            user.expenses[key] = user.expenses[key].filter(e => e.id !== expenseId);
            this.saveData();
            return true;
        }
        return false;
    }

    // Calculate total spent per category for a month
    getSpentByCategory(userId, year, month) {
        const expenses = this.getExpenses(userId, year, month);
        const spent = {};
        expenses.forEach(expense => {
            if (!spent[expense.category]) {
                spent[expense.category] = 0;
            }
            spent[expense.category] += parseFloat(expense.amount) || 0;
        });
        return spent;
    }

    // Calculate total spent for a month
    getTotalSpent(userId, year, month) {
        const expenses = this.getExpenses(userId, year, month);
        return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    }

    // Get all months with data for a user
    getMonthsWithData(userId) {
        const user = this.data.users[userId];
        const months = new Set();

        // Add months from forecasts
        for (const year in user.forecasts) {
            for (const month in user.forecasts[year]) {
                months.add(`${year}-${month}`);
            }
        }

        // Add months from expenses
        for (const key in user.expenses) {
            months.add(key);
        }

        return Array.from(months).sort().reverse();
    }

    // Calculate statistics for a category
    getCategoryStats(userId, category) {
        const user = this.data.users[userId];
        const monthlyTotals = [];

        for (const monthKey in user.expenses) {
            const categoryExpenses = user.expenses[monthKey].filter(e => e.category === category);
            const total = categoryExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            if (total > 0) {
                monthlyTotals.push(total);
            }
        }

        if (monthlyTotals.length === 0) {
            return { average: 0, median: 0, total: 0 };
        }

        const total = monthlyTotals.reduce((sum, v) => sum + v, 0);
        const average = total / monthlyTotals.length;

        // Calculate median
        const sorted = [...monthlyTotals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

        return { average, median, total };
    }

    // Export all data as JSON
    exportJSON() {
        return JSON.stringify(this.data, null, 2);
    }

    // Import data from JSON
    importJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.users) {
                this.data = imported;
                this.saveData();
                return true;
            }
        } catch (e) {
            console.error('Error importing JSON:', e);
        }
        return false;
    }

    // Reset to default data
    reset() {
        this.data = getDefaultData();
        this.saveData();
    }

    // ==========================================
    // Recurring Expenses
    // ==========================================
    getRecurringExpenses(userId) {
        const user = this.data.users[userId];
        if (!user.recurringExpenses) user.recurringExpenses = [];
        return user.recurringExpenses;
    }

    addRecurringExpense(userId, expense) {
        const recurring = this.getRecurringExpenses(userId);
        expense.id = Date.now().toString();
        recurring.push(expense);
        this.saveData();
        return expense.id;
    }

    deleteRecurringExpense(userId, expenseId) {
        const user = this.data.users[userId];
        if (user.recurringExpenses) {
            user.recurringExpenses = user.recurringExpenses.filter(e => e.id !== expenseId);
            this.saveData();
            return true;
        }
        return false;
    }

    applyRecurringToMonth(userId, year, month) {
        const recurring = this.getRecurringExpenses(userId);
        const expenses = this.getExpenses(userId, year, month);

        recurring.forEach(template => {
            const expense = {
                id: (Date.now() + Math.random()).toString(),
                date: `${year}-${month}-01`,
                category: template.category,
                amount: template.amount,
                note: template.note + " (קבוע)",
                isRecurring: true
            };
            expenses.push(expense);
        });

        this.saveData();
        return recurring.length;
    }

    // ==========================================
    // Wishlist / Goals
    // ==========================================
    getWishlist(userId) {
        const user = this.data.users[userId];
        if (!user.wishlist) user.wishlist = [];
        return user.wishlist;
    }

    addWishlistGoal(userId, goal) {
        const wishlist = this.getWishlist(userId);
        goal.id = Date.now().toString();
        goal.savedAmount = goal.savedAmount || 0;
        wishlist.push(goal);
        this.saveData();
        return goal.id;
    }

    updateWishlistGoal(userId, goalId, updatedGoal) {
        const wishlist = this.getWishlist(userId);
        const index = wishlist.findIndex(g => g.id === goalId);
        if (index !== -1) {
            wishlist[index] = { ...wishlist[index], ...updatedGoal };
            this.saveData();
            return true;
        }
        return false;
    }

    deleteWishlistGoal(userId, goalId) {
        const user = this.data.users[userId];
        if (user.wishlist) {
            user.wishlist = user.wishlist.filter(g => g.id !== goalId);
            this.saveData();
            return true;
        }
        return false;
    }
}

// Create global instance
const dataManager = new DataManager();
