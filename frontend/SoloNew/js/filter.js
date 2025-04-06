// Diese Funktion filtert die bestehenden Bewohnerkarten
function applyFilter(criteria) {
    // Standard-Darstellung wiederherstellen, wenn kein Filter gesetzt ist
    const filterBanner = document.getElementById('filterBanner');
    const filterContainer = document.getElementById('filterContainer');
    
    // Alle Karten im residentContainer bearbeiten
    const cards = document.querySelectorAll('#residentContainer .resident-card');
    let visibleCount = 0;
    
    // Wenn es keine Filterkriterien gibt, alle Karten anzeigen
    if (!criteria || Object.keys(criteria).length === 0) {
        cards.forEach(card => {
            card.style.display = '';
        });
        
        // Filter-Banner verstecken und Filter-Container leeren
        filterBanner.style.display = 'none';
        if (filterContainer) {
            filterContainer.style.display = 'none';
            filterContainer.innerHTML = '';
        }
        return;
    }
    
    // Filter auf die bestehenden Karten anwenden
    cards.forEach(card => {
        const residentId = card.getAttribute('data-resident');
        let shouldShow = false;
        
        // Fetch der Bewohnerdaten für detaillierte Filterung
        fetch(`/api/solomenue/bewohner/${residentId}`)
            .then(response => response.json())
            .then(resident => {
                // Überprüfe, ob der Bewohner den Filterkriterien entspricht
                if (criteria.area && criteria.value) {
                    // Spezifischer Bereich und Wert Filter
                    shouldShow = resident[criteria.area] === criteria.value;
                } else if (criteria.area) {
                    // Nur Bereich Filter (zeige alle mit diesem Bereich)
                    shouldShow = resident[criteria.area] !== undefined;
                } else if (criteria.search) {
                    // Suchfilter
                    const searchTerm = criteria.search.toLowerCase();
                    const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
                    shouldShow = fullName.includes(searchTerm);
                }
                
                // Karte ein- oder ausblenden
                card.style.display = shouldShow ? '' : 'none';
                
                // Anzahl sichtbarer Karten zählen
                if (shouldShow) visibleCount++;
                
                // Filter-Banner aktualisieren
                updateFilterBanner(visibleCount, criteria);
            })
            .catch(error => {
                console.error('Fehler beim Laden der Bewohnerdaten:', error);
                // Bei Fehler, Karte sichtbar lassen
                card.style.display = '';
            });
    });
    
    // Filter-Banner anzeigen
    filterBanner.style.display = 'block';
    
    // Filter-Container verstecken, da wir ihn nicht mehr benötigen
    if (filterContainer) {
        filterContainer.style.display = 'none';
    }
}

// Hilfsfunktion zum Aktualisieren des Filter-Banners
function updateFilterBanner(count, criteria) {
    const banner = document.getElementById('activeFilterCount');
    let filterText = '';
    
    if (criteria.area && criteria.value) {
        filterText = `${criteria.area}: ${criteria.value}`;
    } else if (criteria.area) {
        filterText = criteria.area;
    } else if (criteria.search) {
        filterText = `Suche: ${criteria.search}`;
    }
    
    banner.textContent = `${count} Bewohner gefunden (Filter: ${filterText})`;
}

// Event-Listener für Filter-Buttons
document.addEventListener('DOMContentLoaded', function() {
    // Reset-Filter Button
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', function() {
            applyFilter(null); // Alle Filter zurücksetzen
        });
    }
    
    // Filter-Buttons im Filter-Tab
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const area = this.getAttribute('data-area');
            const value = this.getAttribute('data-value');
            
            // Filter anwenden
            if (value) {
                applyFilter({ area, value });
            } else {
                applyFilter({ area });
            }
        });
    });
    
    // Suchfeld
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim();
            if (searchTerm.length > 2) {
                applyFilter({ search: searchTerm });
            } else if (searchTerm.length === 0) {
                applyFilter(null); // Leere Suche = Filter zurücksetzen
            }
        });
    }
}); 