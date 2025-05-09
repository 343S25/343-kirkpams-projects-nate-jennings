document.addEventListener('DOMContentLoaded', function() {
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    const monthButtons = document.querySelectorAll('.month-nav-button');
    let selectedDay, selectedMonth, selectedYear;
    let holidaysCache = {}; 
    
    if (!localStorage.getItem('expenses')) {
        localStorage.setItem('expenses', JSON.stringify([]));
    }
    
    updateCalendar(currentMonth, currentYear);
    monthButtons[currentMonth].classList.add('active');
    
    monthButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            monthButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            updateCalendar(index, currentYear);
        });
    });
    
    const budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
    const saveExpenseBtn = document.getElementById('saveExpense');
    const dadJokeElement = document.getElementById('dadJoke');
    
    async function fetchDadJoke() {
        try {
            const response = await fetch('https://icanhazdadjoke.com/', {
                headers: {
                    'Accept': 'text/plain'
                }
            });
            
            if (response.ok) {
                const joke = await response.text();
                dadJokeElement.textContent = joke;
            } else {
                dadJokeElement.textContent = "Failed to fetch";
            }
        } catch (error){
            console.log('failed to load joke');
        }
    }
    
    function fetchHolidays(month, year) {
        const existingMarkers = document.querySelectorAll('.holiday-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        const allCells = document.querySelectorAll('.calendar-cell');
        
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const validFrom = firstDay.toISOString().split('T')[0];
        const validTo = lastDay.toISOString().split('T')[0];
        
        /*usa is not a country here for some reason??*/
        const countryCode = "DE";
        const languageCode = "EN";
        
        const url = `https://openholidaysapi.org/PublicHolidays?countryIsoCode=${countryCode}&languageIsoCode=${languageCode}&validFrom=${validFrom}&validTo=${validTo}`;
        
        
        fetch(url)
            .then(response => {
                return response.json();
            })
            .then(holidays => {
                console.log("got holidays:", holidays);
                addHolidaysToCalendar(holidays, month, year);
            })
            .catch(error => {
                console.log("issue");
            });
    }
    
    
    function addHolidaysToCalendar(holidays, month, year) {
        
        
        
        holidays.forEach(holiday => {
            try {
                const holidayName = holiday.name.find(n => n.language === "EN")?.text || 
                holiday.name[0]?.text || "Holiday";
                
                const startDate = new Date(holiday.startDate);
                const holidayDay = startDate.getDate();
                
                const selector = `.calendar-cell[data-date="${year}-${month+1}-${holidayDay}"]`;
                const cell = document.querySelector(selector);
                
                if (cell) {
                    
                    const holidayMarker = document.createElement('div');
                    holidayMarker.className = 'holiday-marker';
                    holidayMarker.textContent = holidayName;
                    holidayMarker.title = holidayName;
                    cell.appendChild(holidayMarker);
                    ;
                }
            } catch (error) {
                console.log('error');
            }
        });
    }
    
    document.getElementById('budgetModal').addEventListener('show.bs.modal', fetchDadJoke);
    
    saveExpenseBtn.addEventListener('click', function() {
        const category = document.getElementById('category').value;
        const expenseName = document.getElementById('expenseName').value;
        const amount = document.getElementById('amount').value;
        
        if (category && expenseName && amount) {
            const expense = {
                date: `${selectedYear}-${selectedMonth+1}-${selectedDay}`,
                month: selectedMonth,
                year: selectedYear,
                category: category,
                name: expenseName,
                amount: parseFloat(amount)
            };
            
            const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            expenses.push(expense);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            
            const dayCell = document.querySelector(`.calendar-cell[data-date="${selectedYear}-${selectedMonth+1}-${selectedDay}"]`);
            if (dayCell) {
                const expenseDiv = document.createElement('div');
                expenseDiv.className = 'expense-item';
                expenseDiv.textContent = `$${amount}`;
                dayCell.appendChild(expenseDiv);
            }
            
            document.getElementById('expenseForm').reset();
            budgetModal.hide();
        } else {
            alert('fill in all fields');
        }
    });
    
    function updateCalendar(month, year) {
        const calendarBody = document.getElementById('calendar-body');
        calendarBody.innerHTML = '';
        
        const firstDay = new Date(year, month, 1).getDay();
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let date = 1;
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('div');
                cell.className = 'col calendar-cell';
                
                if (i === 0 && j < firstDay) {
                    cell.textContent = '';
                } else if (date > daysInMonth) {
                    cell.textContent = '';
                } else {
                    cell.textContent = date;
                    cell.setAttribute('data-date', `${year}-${month+1}-${date}`);
                    
                    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
                    const dayExpenses = expenses.filter(expense => 
                        expense.year === year && 
                        expense.month === month && 
                        parseInt(expense.date.split('-')[2]) === date
                    );
                    
                    dayExpenses.forEach(expense => {
                        const expenseDiv = document.createElement('div');
                        expenseDiv.className = 'expense-item';
                        expenseDiv.textContent = `$${expense.amount}`;
                        cell.appendChild(expenseDiv);
                    });
                    
                    cell.addEventListener('click', function() {
                        selectedDay = date;
                        selectedMonth = month;
                        selectedYear = year;
                        document.getElementById('selectedDate').textContent = `${month+1}/${date}/${year}`;
                        budgetModal.show();
                    });
                    
                    date++;
                }
                
                row.appendChild(cell);
            }
            
            calendarBody.appendChild(row);
            
            if (date > daysInMonth) break;
        }
        
        setTimeout(() => {
            fetchHolidays(month, year);
        }, 100);
    }
}); 