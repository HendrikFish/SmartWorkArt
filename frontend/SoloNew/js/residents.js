function displayResidents(residents) {
    const container = document.getElementById('residentContainer');
    container.innerHTML = '';
    
    residents.forEach(resident => {
        // Extrahiere Namen für die Anzeige und das data-attribute
        const firstName = resident.firstName || '';
        const lastName = resident.lastName || '';
        const residentId = `${lastName}_${firstName}`.replace(/\s+/g, '_');
        
        const card = document.createElement('div');
        card.className = 'resident-card';
        card.setAttribute('data-resident', residentId);
        
        card.innerHTML = `
            <img class="card-img-top" src="img/person.png" alt="${firstName} ${lastName}">
            <div class="card-body">
                <h5 class="card-title">${firstName}, ${lastName}</h5>
                <button type="button" class="btn btn-primary">Details ansehen</button>
            </div>
        `;
        
        const button = card.querySelector('button');
        button.addEventListener('click', () => {
            openResidentDetails(residentId);
        });
        
        container.appendChild(card);
    });
}

// Die Filterfunktion filtert die BESTEHENDEN Karten und blendet sie nur ein/aus
function filterResidents(criteria) {
    const cards = document.querySelectorAll('.resident-card');
    
    if (!criteria) {
        // Wenn keine Kriterien, zeige alle Karten
        cards.forEach(card => {
            card.style.display = '';
        });
        return;
    }
    
    // Namen der Bewohner aus den Karten extrahieren und filtern
    cards.forEach(card => {
        const cardTitle = card.querySelector('.card-title').textContent;
        const residentId = card.getAttribute('data-resident');
        let shouldShow = true;
        
        // Beispiel-Filterlogik
        if (criteria.name) {
            const nameToSearch = criteria.name.toLowerCase();
            shouldShow = cardTitle.toLowerCase().includes(nameToSearch) || 
                         residentId.toLowerCase().includes(nameToSearch);
        }
        
        // Weitere Filterkriterien können hier hinzugefügt werden
        
        // Karte ein- oder ausblenden
        card.style.display = shouldShow ? '' : 'none';
    });
} 