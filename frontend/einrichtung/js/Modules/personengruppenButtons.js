// public/js/modules/personengruppenButtons.js

export function setupPersonengruppenButtons() {
    const container = document.querySelector('[data-step="2"]');
    if (!container) return;

    if (container.querySelector('.personengruppen-buttons.gruppen')) return;
    
    const oldSelect = container.querySelector('select[name="personengruppe"]');
    if (oldSelect) {
        oldSelect.style.display = 'none';
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'personengruppen-buttons gruppen';

    const gruppen = ['Schüler', 'Kindergartenkinder', 'Erwachsene'];
    gruppen.forEach(gruppe => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'personengruppe-btn gruppe-btn';
        button.textContent = gruppe;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.gruppe-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            if (oldSelect.value === gruppe) {
                oldSelect.value = '';
                return;
            }
            button.classList.add('active');
            oldSelect.value = gruppe;
        });
        buttonContainer.appendChild(button);
    });

    const heading = container.querySelector('h3');
    heading.insertAdjacentElement('afterend', buttonContainer);
}

export function setupTourButtons() {
    const container = document.querySelector('[data-step="2"]');
    if (!container) return;
    
    if (container.querySelector('.personengruppen-buttons.touren')) return;
    
    let tourSelect = container.querySelector('select[name="tour"]');
    if (!tourSelect) {
        tourSelect = document.createElement('select');
        tourSelect.name = 'tour';
        tourSelect.style.display = 'none';
        tourSelect.innerHTML = `
            <option value="">Wählen Sie eine Tour</option>
            <option value="1">Tour 1</option>
            <option value="2">Tour 2</option>
            <option value="3">Tour 3</option>
        `;
        container.appendChild(tourSelect);
    }

    let tourHeading = container.querySelector('h3[data-tour-heading]');
    if (!tourHeading) {
        tourHeading = document.createElement('h3');
        tourHeading.textContent = 'Tour auswählen';
        tourHeading.setAttribute('data-tour-heading', '');
        container.appendChild(tourHeading);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'personengruppen-buttons touren';

    const touren = [
        { value: '1', label: 'Tour 1: 9:30 Uhr' },
        { value: '2', label: 'Tour 2: 10:30 Uhr' },
        { value: '3', label: 'Tour 3: 11:30 Uhr' }
    ];

    touren.forEach(tour => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'personengruppe-btn tour-btn';
        button.textContent = tour.label;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.tour-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            if (tourSelect.value === tour.value) {
                tourSelect.value = '';
                return;
            }
            button.classList.add('active');
            tourSelect.value = tour.value;
        });
        buttonContainer.appendChild(button);
    });

    container.appendChild(buttonContainer);
}
