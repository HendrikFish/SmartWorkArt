// Importiere die Konfiguration
import config from '../../js/config.js';

const API_BASE_URL = `${config.API_ENDPOINT}/numbers`;
let currentYear;
let currentWeek;

function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

function initializeCurrentDate() {
    currentYear = new Date().getFullYear();
    currentWeek = getCurrentWeek();
    updatePeriodDisplay();
    loadOrderData(currentYear, currentWeek);
}

function getWeekDates(year, week) {
    // Erster Januar des Jahres
    const firstJan = new Date(year, 0, 1);
    // Erster Tag der Woche (Montag)
    const firstWeekDay = new Date(year, 0, 1 + (week - 1) * 7 - firstJan.getDay() + 1);
    
    const dates = [];
    for(let i = 0; i < 7; i++) {
        const date = new Date(firstWeekDay);
        date.setDate(firstWeekDay.getDate() + i);
        dates.push(date);
    }
    return dates;
}

function getMonthName(month) {
    const months = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return months[month];
}

function updatePeriodDisplay() {
    const dates = getWeekDates(currentYear, currentWeek);
    
    // Finde alle unterschiedlichen Monate in der Woche
    const uniqueMonths = [...new Set(dates.map(date => date.getMonth()))];
    const monthNames = uniqueMonths.map(month => getMonthName(month));
    
    // Verbinde die Monatsnamen mit Bindestrich, wenn es mehrere sind
    const monthDisplay = monthNames.join(' - ');
    
    document.getElementById('currentPeriod').innerHTML = 
        `Jahr ${currentYear} - KW ${currentWeek}<br><span class="month-display">${monthDisplay}</span>`;
}

function navigateWeek(direction) {
    currentWeek += direction;
    
    if (currentWeek > 52) {
        currentWeek = 1;
        currentYear++;
    } else if (currentWeek < 1) {
        currentWeek = 52;
        currentYear--;
    }
    
    updatePeriodDisplay();
    loadOrderData(currentYear, currentWeek);
}

async function loadOrderData(year, week) {
    try {
        const [orderResponse, facilitiesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/data/${year}/${week}`),
            fetch(`${API_BASE_URL}/einrichtungen/all`)
        ]);
        
        const [orderData, facilitiesData] = await Promise.all([
            orderResponse.json(),
            facilitiesResponse.json()
        ]);

        // Gruppiere OrderData nach Touren
        const groupedData = {
            '1': [],
            '2': [],
            '3': []
        };
        
        orderData.forEach(facility => {
            const facilityData = facilitiesData.find(f => f.name === facility.einrichtung);
            const tour = facilityData?.tour || '1';
            groupedData[tour].push(facility);
        });
        
        updateTable(groupedData, facilitiesData);
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        console.log('Details:', error.message);
    }
}

function updateTable(groupedOrderData, facilitiesData) {
    const tbody = document.querySelector('#orderTable tbody');
    tbody.innerHTML = '';
    
    // Update header with dates
    const headerRow = document.querySelector('#orderTable thead tr');
    const dates = getWeekDates(currentYear, currentWeek);
    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    // Aktualisiere die Header-Zellen mit Datum
    headerRow.innerHTML = '<th>Einrichtung</th>';
    days.forEach((day, index) => {
        const date = dates[index];
        const dateStr = `${date.getDate()}.${date.getMonth() + 1}.`;
        headerRow.innerHTML += `
            <th>
                <div class="date-display">${dateStr}</div>
                ${day.substring(0, 2)}
            </th>
        `;
    });
    headerRow.innerHTML += '<th>Info</th>';
    
    const tourTimes = {
        '1': '9:30 Uhr',
        '2': '10:30 Uhr',
        '3': '11:30 Uhr'
    };

    // Personengruppen-Farben
    const groupColors = {
        'Kindergartenkinder': '#d4edda', // Pastellgrün
        'Schüler': '#cce5ff',     // Pastellblau
        'Erwachsene': '#fff3cd'   // Pastellorange
    };

    // Sortierreihenfolge für Personengruppen
    const groupOrder = ['Kindergartenkinder', 'Schüler', 'Erwachsene'];
    
    // Initialisiere Gesamtsummen für jeden Tag
    const totalSums = days.map(() => 0);
    
    ['1', '2', '3'].forEach(tour => {
        const headerRow = document.createElement('tr');
        headerRow.classList.add('tour-header');
        headerRow.innerHTML = `<td colspan="9">Tour ${tour} - ${tourTimes[tour]}</td>`;
        tbody.appendChild(headerRow);
        
        if (groupedOrderData[tour]) {
            // Sortiere Einrichtungen nach Personengruppen
            const sortedFacilities = groupedOrderData[tour].sort((a, b) => {
                const facilityA = facilitiesData.find(f => f.name === a.einrichtung);
                const facilityB = facilitiesData.find(f => f.name === b.einrichtung);
                
                const groupA = facilityA?.personengruppe || '';
                const groupB = facilityB?.personengruppe || '';
                
                return groupOrder.indexOf(groupA) - groupOrder.indexOf(groupB);
            });

            sortedFacilities.forEach(facility => {
                const facilityData = facilitiesData.find(f => f.name === facility.einrichtung);
                const row = document.createElement('tr');
                
                // Setze Hintergrundfarbe basierend auf Personengruppe
                if (facilityData?.personengruppe) {
                    row.style.backgroundColor = groupColors[facilityData.personengruppe];
                }

                row.innerHTML = `<td>${facility.einrichtung}</td>`;
                
                // Normale Tageseinträge
                days.forEach(day => {
                    const dayOrders = facility.orders.filter(order => 
                        order.day === day && order.component === 'hauptspeise'
                    );
                    
                    const totalAmount = dayOrders.reduce((sum, order) => sum + order.amount, 0);
                    row.innerHTML += `<td class="number-cell">${totalAmount || ''}</td>`;
                });
                
                // Infospalte mit Buttons
                const infos = facility.orders
                    .filter(order => order.component === 'information')
                    .map(order => {
                        const buttonClass = order.info.includes('ERLEDIGT') ? 'info-button done' : 'info-button';
                        return `<button class="${buttonClass}" 
                            data-day="${order.day}" 
                            data-info="${order.info}"
                            data-facility="${facility.einrichtung}"
                            data-year="${facility.year}"
                            data-week="${facility.week}">
                            ${order.day}
                        </button>`;
                    })
                    .join(' ');
                
                row.innerHTML += `<td class="info-column">${infos}</td>`;
                
                tbody.appendChild(row);
            });
            
            // Summenzeile für diese Tour
            const tourSumRow = document.createElement('tr');
            tourSumRow.classList.add('tour-sum');
            tourSumRow.innerHTML = '<td>Summe</td>';
            
            // Berechne Summe für jeden Tag
            days.forEach((_, dayIndex) => {
                let daySum = 0;
                groupedOrderData[tour].forEach(facility => {
                    const dayOrders = facility.orders.filter(order => 
                        order.day === days[dayIndex] && order.component === 'hauptspeise'
                    );
                    daySum += dayOrders.reduce((sum, order) => sum + order.amount, 0);
                });
                totalSums[dayIndex] += daySum; // Addiere zur Gesamtsumme
                tourSumRow.innerHTML += `<td class="sum-column">${daySum || ''}</td>`;
            });
            
            tourSumRow.innerHTML += '<td></td>'; // Leere Infozelle
            tbody.appendChild(tourSumRow);
        }
    });
    
    // Füge Gesamtsummenzeile hinzu
    const totalRow = document.createElement('tr');
    totalRow.classList.add('total-sum');
    totalRow.innerHTML = '<td>Gesamtsumme</td>';
    
    days.forEach((_, dayIndex) => {
        totalRow.innerHTML += `<td class="total-sum-column">${totalSums[dayIndex] || ''}</td>`;
    });
    
    totalRow.innerHTML += '<td></td>'; // Leere Infozelle
    tbody.appendChild(totalRow);
}

// Popup-Fenster für Infos
function createInfoPopup(info, day, facility, year, week) {
    const popup = document.createElement('div');
    popup.className = 'info-popup';
    
    popup.innerHTML = `
        <div class="info-popup-content">
            <h3>${facility} - ${day}</h3>
            <p>${info}</p>
            <div class="info-popup-buttons">
                <button class="done-button" ${info.includes('ERLEDIGT') ? 'disabled' : ''}>
                    Erledigt
                </button>
                <button class="close-button">Schließen</button>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector('.close-button').addEventListener('click', () => {
        popup.remove();
    });

    const doneButton = popup.querySelector('.done-button');
    let isConfirmationStep = false;

    doneButton.addEventListener('click', async () => {
        if (!isConfirmationStep) {
            // Erster Klick - Bestätigungsschritt
            isConfirmationStep = true;
            doneButton.textContent = 'Sicher?';
            doneButton.classList.add('confirm-state');
            
            // Reset nach 3 Sekunden, wenn nicht bestätigt
            setTimeout(() => {
                if (isConfirmationStep) {
                    isConfirmationStep = false;
                    doneButton.textContent = 'Erledigt';
                    doneButton.classList.remove('confirm-state');
                }
            }, 3000);
            
            return;
        }

        // Zweiter Klick - Bestätigt
        doneButton.disabled = true;
        doneButton.textContent = 'Wird gespeichert...';

        try {
            const updatedInfo = info.includes('ERLEDIGT') ? info : `${info}- ERLEDIGT`;
            
            const response = await fetch(`${API_BASE_URL}/data/${year}/${week}/updateInfo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facility,
                    day,
                    info: updatedInfo
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Fehler beim Aktualisieren der Info');
            }

            // Update Button in der Tabelle
            const button = document.querySelector(`button.info-button[data-day="${day}"][data-facility="${facility}"]`);
            if (button) {
                button.classList.add('done');
                button.setAttribute('data-info', updatedInfo);
            }
            
            popup.remove();
            await loadOrderData(year, week);
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Info:', error);
            alert(`Fehler beim Speichern der Änderung: ${error.message}`);
            // Bei Fehler Button zurücksetzen
            isConfirmationStep = false;
            doneButton.disabled = false;
            doneButton.textContent = 'Erledigt';
            doneButton.classList.remove('confirm-state');
        }
    });
}

// Event Listener für Info-Buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('info-button')) {
        const { day, info, facility, year, week } = e.target.dataset;
        createInfoPopup(info, day, facility, year, week);
    }
});

// Event Listeners
document.getElementById('prevWeek').addEventListener('click', () => navigateWeek(-1));
document.getElementById('nextWeek').addEventListener('click', () => navigateWeek(1));
document.getElementById('currentWeek').addEventListener('click', initializeCurrentDate);

// Initial load and refresh
initializeCurrentDate();
setInterval(() => {
    loadOrderData(currentYear, currentWeek);
}, 60000);
