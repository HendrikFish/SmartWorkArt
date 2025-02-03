class MenuPlan {
    constructor() {
        const today = new Date();
        this.currentYear = today.getFullYear();
        this.currentWeek = this.getWeekNumber(today);
        this.selectedEinrichtung = null;

        this.initializeElements();
        this.addEventListeners();
        this.loadEinrichtungen();
    }

    initializeElements() {
        this.einrichtungSelect = document.getElementById('einrichtungSelect');
        this.menuPlanDiv = document.getElementById('menuPlan');
        this.weekDisplay = document.getElementById('currentWeek');
        this.prevWeekBtn = document.getElementById('prevWeek');
        this.nextWeekBtn = document.getElementById('nextWeek');
        
        // Controls Container finden
        const controlsDiv = document.querySelector('.controls');
        const weekControls = controlsDiv.querySelector('.week-controls');
        
        // Heute-Button hinzufügen
        if (!document.getElementById('currentWeekBtn')) {
            const currentWeekBtn = document.createElement('button');
            currentWeekBtn.id = 'currentWeekBtn';
            currentWeekBtn.innerHTML = '📅 Heute';
            currentWeekBtn.className = 'current-week-button';
            this.nextWeekBtn.insertAdjacentElement('afterend', currentWeekBtn);
            
            // Event Listener für Heute-Button
            currentWeekBtn.addEventListener('click', async () => {
                const today = new Date();
                this.currentWeek = this.getWeekNumber(today);
                this.currentYear = today.getFullYear();
                this.updateWeekDisplay();
                if (this.selectedEinrichtung) {
                    await this.loadAndDisplayPlan();
                }
            });
        }
        
        // Monatsanzeige in neuem Container
        if (!document.querySelector('.month-container')) {
            const monthContainer = document.createElement('div');
            monthContainer.className = 'month-container';
            this.monthDisplay = document.createElement('div');
            this.monthDisplay.id = 'monthDisplay';
            this.monthDisplay.className = 'month-display';
            monthContainer.appendChild(this.monthDisplay);
            
            // Nach controls einfügen
            controlsDiv.insertAdjacentElement('afterend', monthContainer);
        } else {
            this.monthDisplay = document.getElementById('monthDisplay');
        }
        
        // Zeige aktuelle Woche und Monat an
        this.updateWeekDisplay();
        
        // Print Button nur hinzufügen, wenn er noch nicht existiert
        if (!document.getElementById('printButton')) {
            const printButton = document.createElement('button');
            printButton.id = 'printButton';
            printButton.innerHTML = '🖨️ Drucken';
            printButton.className = 'print-button';
            controlsDiv.appendChild(printButton);
        }
        
        // Print Event Listener immer neu hinzufügen
        document.getElementById('printButton').addEventListener('click', () => this.printMenuPlan());
    }

    addEventListeners() {
        // Einrichtungsauswahl
        this.einrichtungSelect.addEventListener('change', async () => {
            const selectedEinrichtung = this.einrichtungSelect.value;
            if (selectedEinrichtung) {
                this.selectedEinrichtung = selectedEinrichtung;
                await this.loadAndDisplayPlan();
            }
        });

        // Wochenwechsel
        this.prevWeekBtn.addEventListener('click', async () => {
            this.currentWeek--;
            if (this.currentWeek < 1) {
                this.currentWeek = 52;
                this.currentYear--;
            }
            this.updateWeekDisplay();
            if (this.selectedEinrichtung) {
                await this.loadAndDisplayPlan();
            }
        });

        this.nextWeekBtn.addEventListener('click', async () => {
            this.currentWeek++;
            if (this.currentWeek > 52) {
                this.currentWeek = 1;
                this.currentYear++;
            }
            this.updateWeekDisplay();
            if (this.selectedEinrichtung) {
                await this.loadAndDisplayPlan();
            }
        });
    }

    updateWeekDisplay() {
        this.weekDisplay.textContent = `KW${this.currentWeek}/${this.currentYear}`;
        this.monthDisplay.textContent = this.getMonthsForWeek(this.currentYear, this.currentWeek);
    }

    createMonthDisplay() {
        const monthDisplay = document.createElement('div');
        monthDisplay.id = 'monthDisplay';
        monthDisplay.className = 'month-display';
        // Nach der Wochenanzeige einfügen
        this.weekDisplay.parentNode.insertBefore(monthDisplay, this.weekDisplay.nextSibling);
        return monthDisplay;
    }

    async loadAndDisplayPlan() {
        try {
            const plan = await this.loadMenuPlan(this.selectedEinrichtung);
            if (!plan || !plan.woche || !plan.jahr) {
                console.error('Ungültige Plan-Daten:', plan);
                return;
            }
            this.displayPlan(plan, this.selectedEinrichtung);
        } catch (error) {
            console.error(error);
            this.menuPlanDiv.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async loadMenuPlan(einrichtungName) {
        if (!einrichtungName) {
            throw new Error('Bitte wählen Sie eine Einrichtung aus');
        }

        const response = await fetch(`/api/menue/plan/${this.currentYear}/KW${this.currentWeek}`);
        if (!response.ok) {
            throw new Error(`Kein Menüplan für KW${this.currentWeek}/${this.currentYear} verfügbar`);
        }
        
        const data = await response.json();
        return data.menuePlane[0];
    }

    displayPlan(plan, einrichtungName) {
        if (!this.menuPlanDiv) return;

        const einrichtung = plan.einrichtungen.find(e => e.name === einrichtungName);
        if (!einrichtung) {
            throw new Error(`Keine Daten für ${einrichtungName} gefunden`);
        }

        // Anpassung an die API-Struktur
        const week = parseInt(plan.woche.replace('KW', ''));
        const year = parseInt(plan.jahr);

        if (isNaN(week) || isNaN(year)) {
            console.error('Ungültige Woche oder Jahr in Plan:', plan);
            return;
        }

        const isErwachsene = einrichtung.personengruppe === "Erwachsene";
        const isSchuleOderKita = ['Schüler', 'Kindergartenkinder'].includes(einrichtung.personengruppe);
        const allergenMap = this.getAllergenCodesAndNames(plan);

        const lastActiveDay = plan.tage.reduce((lastDay, tag, index) => {
            const tagesOptionen = einrichtung.speiseangebot.find(angebot => angebot.tag === tag.tag);
            return tagesOptionen?.hauptspeise ? index : lastDay;
        }, 0);

        const daysHtml = plan.tage.map((tag, index) => {
            if (index > lastActiveDay) return '';

            const tagesOptionen = einrichtung.speiseangebot.find(angebot => angebot.tag === tag.tag);
            if (!tagesOptionen || !tagesOptionen.hauptspeise) return '';

            const showMenu1 = isErwachsene || tag.einrichtungen.menu1.some(e => e.name === einrichtungName);
            const showMenu2 = isErwachsene || tag.einrichtungen.menu2.some(e => e.name === einrichtungName);
            const showSuppe = ['Schüler', 'Kindergartenkinder'].includes(einrichtung.personengruppe) 
                ? tagesOptionen.suppe : true;
            const showDessert = ['Schüler', 'Kindergartenkinder'].includes(einrichtung.personengruppe)
                ? tagesOptionen.dessert : true;

            return `
                <div class="day-card">
                    ${this.renderDayHeader(tag.tag, year, week)}
                    <div class="menu-grid ${isSchuleOderKita ? 'school-kita' : ''}">
                        ${showSuppe && tag.menu.suppe?.length > 0 
                            ? this.renderMenuSection('Suppe', tag.menu.suppe, 'menu-row-suppe') 
                            : '<div class="menu-section menu-row-suppe empty"></div>'}
                        ${this.renderHauptspeiseSection(tag.menu.hauptspeise, isSchuleOderKita, isErwachsene)}
                        ${showDessert && tag.menu.dessert?.length > 0 
                            ? this.renderMenuSection('Dessert', tag.menu.dessert, 'menu-row-dessert') 
                            : '<div class="menu-section menu-row-dessert empty"></div>'}
                    </div>
                </div>
            `;
        }).filter(html => html !== '');

        const legendHtml = `
            <div class="allergen-legend">
                <h4>Allergene:</h4>
                <p>${Array.from(allergenMap.entries())
                    .map(([code, name]) => `${code} = ${name}`)
                    .join(', ')}</p>
            </div>
        `;

        // Monatsanzeige
        const monthDisplay = `
            <div class="month-display">
                ${this.getMonthsForWeek(year, week)}
            </div>
        `;

        this.menuPlanDiv.innerHTML = daysHtml.length > 0 
            ? `<div class="menu-wrapper">
                ${monthDisplay}
                <div class="menu-container">
                    ${daysHtml.join('')}
                </div>
                ${legendHtml}
               </div>`
            : '<p>Kein Menüplan für diese Einrichtung an dieser Woche verfügbar.</p>';
    }

    renderMenuSection(title, items, rowClass) {
        if (!items || (Array.isArray(items) && items.length === 0)) {
            return `<div class="menu-section ${rowClass} empty"></div>`;
        }
        
        const allergenCodes = this.getAllergenCodes(items);
        
        return `
            <div class="menu-section ${rowClass}">
                <h4>${title}</h4>
                ${Array.isArray(items) 
                    ? items.map(item => `<p>${item.name}</p>`).join('')
                    : ''}
                ${allergenCodes.length > 0 
                    ? `<p class="allergen-codes">Allergene: ${allergenCodes.join(', ')}</p>`
                    : ''}
            </div>
        `;
    }

    getAllergenCodes(items) {
        // Sammle alle unique Allergen-Codes aus allen Zutaten
        const codes = new Set();
        items.forEach(item => {
            item.zutaten?.forEach(zutat => {
                zutat.allergenCodes?.forEach(code => {
                    codes.add(code);
                });
            });
        });
        return Array.from(codes).sort();
    }

    getAllergenCodesAndNames(plan) {
        const allergenMap = new Map();
        plan.tage.forEach(tag => {
            [
                ...(tag.menu.suppe || []),
                ...(tag.menu.hauptspeise.menu1 || []),
                ...(tag.menu.hauptspeise.menu2 || []),
                ...(tag.menu.dessert || [])
            ].forEach(item => {
                item.zutaten?.forEach(zutat => {
                    if (zutat.allergenCodes && zutat.allergene) {
                        zutat.allergenCodes.forEach((code, index) => {
                            allergenMap.set(code, zutat.allergene[index]);
                        });
                    }
                });
            });
        });
        return allergenMap;
    }

    getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        return weekNo;
    }

    async loadEinrichtungen() {
        try {
            const response = await fetch('/api/menue/einrichtungen');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Einrichtungen');
            }
            
            const data = await response.json();
            
            // Leere das Select und füge die Default-Option hinzu
            this.einrichtungSelect.innerHTML = '<option value="">Einrichtung wählen...</option>';
            
            // Füge die Einrichtungen hinzu
            data.forEach(einrichtung => {
                const option = document.createElement('option');
                option.value = einrichtung.name;
                option.textContent = einrichtung.name;
                this.einrichtungSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Fehler beim Laden der Einrichtungen:', error);
            this.einrichtungSelect.innerHTML = '<option value="">Fehler beim Laden</option>';
        }
    }

    getMonthsForWeek(year, week) {
        const startDate = this.getDateOfISOWeek(week, year);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4); // Nur bis Freitag

        const months = new Set([
            startDate.toLocaleString('de-DE', { month: 'long' }),
            endDate.toLocaleString('de-DE', { month: 'long' })
        ]);

        return Array.from(months).join(' / ');
    }

    getDateOfISOWeek(week, year) {
        try {
            // Konvertiere zu Zahlen
            week = parseInt(week);
            year = parseInt(year);
            
            // Validierung
            if (isNaN(week) || isNaN(year) || week < 1 || week > 53) {
                console.error('Ungültige Woche oder Jahr:', week, year);
                return null;
            }

            // Berechne den ersten Tag des Jahres
            const januaryFirst = new Date(year, 0, 1);
            const dayOffset = januaryFirst.getDay() || 7; // 1 = Montag, 7 = Sonntag

            // Berechne den ersten Montag der ersten Woche
            const firstMonday = new Date(year, 0, 1 + (8 - dayOffset));
            
            // Berechne den Montag der gewünschten Woche
            const targetMonday = new Date(firstMonday);
            targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);

            return targetMonday;
        } catch (error) {
            console.error('Fehler in getDateOfISOWeek:', error);
            return null;
        }
    }

    formatDate(date) {
        try {
            if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
                console.error('Ungültiges Datum:', date);
                return '';
            }
            return date.toLocaleString('de-DE', { 
                day: '2-digit',
                month: '2-digit'
            });
        } catch (error) {
            console.error('Fehler in formatDate:', error);
            return '';
        }
    }

    renderDayHeader(tag, year, week) {
        try {
            const startDate = this.getDateOfISOWeek(week, year);
            if (!startDate) {
                console.error('Kein gültiges Startdatum für:', week, year);
                return `<div class="day-header"><h3>${tag}</h3></div>`;
            }

            const dayOffset = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].indexOf(tag);
            if (dayOffset === -1) {
                console.error('Ungültiger Wochentag:', tag);
                return `<div class="day-header"><h3>${tag}</h3></div>`;
            }

            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + dayOffset);

            const formattedDate = this.formatDate(dayDate);
            
            return `
                <div class="day-header">
                    <div class="date">${formattedDate}</div>
                    <h3>${tag}</h3>
                </div>
            `;
        } catch (error) {
            console.error('Fehler in renderDayHeader:', error, {tag, year, week});
            return `<div class="day-header"><h3>${tag}</h3></div>`;
        }
    }

    printMenuPlan() {
        try {
            const originalContent = document.body.innerHTML;
            const mainContent = document.querySelector('main').innerHTML;
            const einrichtungName = this.einrichtungSelect.options[this.einrichtungSelect.selectedIndex].text;
            
            document.body.innerHTML = `
                <style>
                    @media print {
                        @page {
                            size: A4 landscape;
                            margin: 1cm;
                        }
                        body {
                            margin: 0;
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }
                        main {
                            width: 100%;
                            max-width: 277mm;
                            margin: auto;
                        }
                        .einrichtung-title {
                            text-align: center;
                            font-size: 18pt;
                            font-weight: bold;
                            margin-bottom: 15px;
                            width: 100%;
                        }
                        .menu-wrapper {
                            width: 100%;
                            box-shadow: none !important;
                        }
                        .menu-container {
                            display: flex;
                            justify-content: space-between;
                            gap: 5px;
                            width: 100%;
                        }
                        .day-card {
                            flex: 1;
                            border: 1px solid #ddd;
                            page-break-inside: avoid;
                            font-size: 9pt;
                            box-shadow: none !important;
                        }
                        /* ... restliche Styles ... */
                        * {
                            box-shadow: none !important;
                        }
                        .controls, .print-button {
                            display: none !important;
                        }
                        @media screen {
                            body { display: none; }
                        }
                    }
                </style>
                <main style="margin: auto;">
                    <div class="einrichtung-title">${einrichtungName}</div>
                    ${mainContent}
                </main>
            `;

            window.print();

            // Originalinhalt wiederherstellen und neu initialisieren
            setTimeout(() => {
                document.body.innerHTML = originalContent;
                const menuPlan = new MenuPlan();
                menuPlan.selectedEinrichtung = this.selectedEinrichtung;
                menuPlan.currentWeek = this.currentWeek;
                menuPlan.currentYear = this.currentYear;
                if (this.selectedEinrichtung) {
                    menuPlan.loadAndDisplayPlan();
                }
            }, 500);

        } catch (error) {
            console.error('Fehler beim Drucken:', error);
            alert('Fehler beim Drucken. Bitte versuchen Sie es erneut.');
        }
    }

    renderHauptspeiseSection(hauptspeise, isSchuleOderKita, isErwachsene) {
        if (isSchuleOderKita) {
            // Für Schulen und Kitas: Nur eine Hauptspeise anzeigen
            const menu = hauptspeise.menu1?.length > 0 ? hauptspeise.menu1 : hauptspeise.menu2;
            if (!menu) return '<div class="menu-section menu-row-main empty"></div>';
            
            return this.renderMenuSection('Hauptspeise', menu, 'menu-row-main');
        } else {
            // Für Erwachsene: Beide Menüs anzeigen wie bisher
            return `
                ${hauptspeise.menu1?.length > 0 
                    ? this.renderMenuSection('Menü 1', hauptspeise.menu1, 'menu-row-menu1') 
                    : '<div class="menu-section menu-row-menu1 empty"></div>'}
                ${hauptspeise.menu2?.length > 0 
                    ? this.renderMenuSection('Menü 2', hauptspeise.menu2, 'menu-row-menu2') 
                    : '<div class="menu-section menu-row-menu2 empty"></div>'}
            `;
        }
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    new MenuPlan();
});

// Zusammengeführtes CSS
const style = document.createElement('style');
style.textContent = `
    .menu-wrapper {
        display: flex;
        flex-direction: column;
        width: fit-content;
    }
    .menu-container {
        display: flex;
        flex-direction: row;
        gap: 10px;
        width: fit-content;
    }
    .allergen-codes {
        font-size: 0.8em;
        color: #666;
        margin-top: 2px;
    }
    .allergen-legend {
        margin-top: 20px;
        padding: 10px;
        border: 1px solid #ddd;
        box-sizing: border-box;
        width: 100%;
    }
    .allergen-legend h4 {
        margin: 0;
        display: inline;
        margin-right: 10px;
        font-weight: bold;
    }
    .allergen-legend p {
        display: inline;
        font-size: 0.9em;
        color: #444;
    }
    .day-card {
        width: 200px;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto;
        border: 1px solid #ddd;
        padding: 10px;
        margin: 5px;
    }
    .day-card h3 {
        grid-column: 1 / -1;
        margin: 0 0 10px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #eee;
    }
    .menu-section {
        padding: 5px;
        margin: 2px 0;
        min-height: 100px;
    }
    .menu-section.empty {
        min-height: 100px;
    }
    .menu-grid {
        display: grid;
        grid-template-rows: 100px auto auto 100px;
        gap: 5px;
       
    }
    .menu-row-suppe {
        grid-row: 1;
        border:1px solid #ddd;
    }
    .menu-row-menu1 {
        grid-row: 2;
        border:1px solid #ddd;
    }
    .menu-row-menu2 {
        grid-row: 3;
        border:1px solid #ddd;
    }
    .menu-row-dessert {
        grid-row: 4;
        border:1px solid #ddd;
    }
    .menu-section h4 {
        margin: 0 0 5px 0;
    }
    .menu-section p {
        margin: 2px 0;
    }
    .month-container {
        text-align: center;
        margin: 5px 0 15px 0;
        width: 100%;
    }
    .month-display {
        font-size: 1.1em;
        color: #666;
        display: inline-block;
    }
    #currentWeek {
        display: inline-block;
        margin-right: 5px;
    }
    .day-header {
        height: 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-bottom: 1px solid #eee;
        margin-bottom: 10px;
    }
    .day-header .date {
        font-size: 0.9em;
        color: #666;
        margin-top: 10px;
    }
    .day-header h3 {
        margin: 5px 0;
    }
    .print-button {
        background: #4CAF50 !important;
        color: white !important;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
    }
    .print-button:hover {
        background: #45a049 !important;
    }
    @media print {
        .print-button {
            display: none;
        }
    }
    .current-week-button {
        background: #4CAF50 !important;
        color: white !important;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        margin-left: 10px;
    }
    .current-week-button:hover {
        background: #45a049 !important;
    }
    @media print {
        .current-week-button {
            display: none;
        }
    }
    .menu-grid.school-kita {
        grid-template-rows: auto auto auto !important;
    }
    .menu-grid.school-kita .menu-row-main {
        grid-row: 2;
        border: 1px solid #ddd;
    }
`;
document.head.appendChild(style);
