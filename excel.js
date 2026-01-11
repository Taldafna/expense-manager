/**
 * Excel Import/Export functionality using SheetJS
 */

const ExcelManager = {
    // Export data to Excel file
    exportToExcel(userId) {
        const user = dataManager.getUser(userId);
        const workbook = XLSX.utils.book_new();

        // Sheet 1: Categories
        const categoriesData = user.categories.map((cat, i) => ({
            'מספר': i + 1,
            'קטגוריה': cat
        }));
        const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'קטגוריות');

        // Sheet 2: Incomes & Savings (all months)
        const incomeData = [];
        const yearsSet = new Set();
        for (const y in user.forecasts) yearsSet.add(y);
        for (const k in user.expenses) yearsSet.add(k.split('-')[0]);

        const sortedYears = [...yearsSet].sort();

        sortedYears.forEach(year => {
            for (let m = 1; m <= 12; m++) {
                const month = m.toString().padStart(2, '0');
                const forecast = dataManager.getForecast(userId, year, month);
                const actualSavings = dataManager.getActualSavings(userId, year, month);
                const totalSpent = dataManager.getTotalSpent(userId, year, month);

                // Only add if there is some data
                if (forecast.income > 0 || forecast.actualIncome !== null || actualSavings.total > 0 || totalSpent > 0) {
                    incomeData.push({
                        'שנה': year,
                        'חודש': MONTH_NAMES[m - 1],
                        'הכנסה צפויה': forecast.income || 0,
                        'הכנסה בפועל': forecast.actualIncome !== null ? forecast.actualIncome : forecast.income,
                        'סה"כ הוצאות': totalSpent,
                        'חיסכון בנק': actualSavings.bank || 0,
                        'חיסכון פנסיה': actualSavings.pension || 0,
                        'סה"כ חיסכון': actualSavings.total || 0,
                        'לא מתועד (נעלם)': (forecast.actualIncome !== null ? forecast.actualIncome : forecast.income) - totalSpent - actualSavings.total
                    });
                }
            }
        });

        if (incomeData.length > 0) {
            const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
            XLSX.utils.book_append_sheet(workbook, incomeSheet, 'הכנסות וחסכונות');
        }

        // Sheet 3: Forecasts (Detailed Budgets)
        const forecastsData = [];
        sortedYears.forEach(year => {
            for (let m = 1; m <= 12; m++) {
                const month = m.toString().padStart(2, '0');
                const forecast = dataManager.getForecast(userId, year, month);
                const row = {
                    'שנה': year,
                    'חודש': MONTH_NAMES[m - 1],
                    'תחזית הכנסה': forecast.income || 0
                };
                user.categories.forEach(cat => {
                    row[`תקציב: ${cat}`] = forecast.budgets[cat] || 0;
                });
                forecastsData.push(row);
            }
        });

        if (forecastsData.length > 0) {
            const forecastsSheet = XLSX.utils.json_to_sheet(forecastsData);
            XLSX.utils.book_append_sheet(workbook, forecastsSheet, 'תחזיות מפורטות');
        }

        // Sheet 4: All Expenses
        const expensesData = [];
        for (const monthKey in user.expenses) {
            user.expenses[monthKey].forEach(expense => {
                expensesData.push({
                    'תאריך': expense.date,
                    'קטגוריה': expense.category,
                    'סכום': expense.amount,
                    'הערה': expense.note || ''
                });
            });
        }
        if (expensesData.length > 0) {
            const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
            XLSX.utils.book_append_sheet(workbook, expensesSheet, 'הוצאות');
        }

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        const filename = `הוצאות_${user.name}_${date}.xlsx`;

        // Download file
        XLSX.writeFile(workbook, filename);
        return true;
    },

    // Import data from Excel file
    async importFromExcel(userId, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    let imported = { categories: 0, forecasts: 0, expenses: 0 };

                    // Import Categories
                    if (workbook.SheetNames.includes('קטגוריות')) {
                        const sheet = workbook.Sheets['קטגוריות'];
                        const rows = XLSX.utils.sheet_to_json(sheet);
                        rows.forEach(row => {
                            const catName = row['קטגוריה'];
                            if (catName && dataManager.addCategory(userId, catName)) {
                                imported.categories++;
                            }
                        });
                    }

                    // Import Expenses
                    if (workbook.SheetNames.includes('הוצאות')) {
                        const sheet = workbook.Sheets['הוצאות'];
                        const rows = XLSX.utils.sheet_to_json(sheet);
                        rows.forEach(row => {
                            if (row['תאריך'] && row['סכום']) {
                                // Parse date
                                let dateStr = row['תאריך'];
                                if (typeof dateStr === 'number') {
                                    // Excel date serial number
                                    const date = XLSX.SSF.parse_date_code(dateStr);
                                    dateStr = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                                }

                                const parts = dateStr.split('-');
                                if (parts.length >= 2) {
                                    const year = parts[0];
                                    const month = parts[1];

                                    dataManager.addExpense(userId, year, month, {
                                        amount: parseFloat(row['סכום']) || 0,
                                        category: row['קטגוריה'] || 'אחר',
                                        date: dateStr,
                                        note: row['הערה'] || ''
                                    });
                                    imported.expenses++;
                                }
                            }
                        });
                    }

                    resolve(imported);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
};
