import { editEinrichtung } from "./einrichtungEdit.js";
import { showToast } from "./toast.js";

// Export der Hauptfunktionen
export async function loadEinrichtungen() {
    try {
        const response = await fetch('http://localhost:8086/api/einrichtungen');
        
        if (!response.ok) {
            throw new Error(`HTTP-Fehler! Status: ${response.status}`);
        }

        const einrichtungen = await response.json();
        console.log('Geladene Einrichtungen:', einrichtungen);
        
        // Listen leeren
        document.getElementById('kindergarten-liste').innerHTML = '';
        document.getElementById('schueler-liste').innerHTML = '';
        document.getElementById('erwachsene-liste').innerHTML = '';
        
        // Einrichtungen nach Kategorien sortieren und anzeigen
        einrichtungen.forEach(einrichtung => {
            const card = createEinrichtungCard(einrichtung);
            // Mapping für die Listen-IDs
            const listMapping = {
                'Kindergartenkinder': 'kindergarten-liste',
                'Schüler': 'schueler-liste',
                'Erwachsene': 'erwachsene-liste'
            };
            
            const targetListId = listMapping[einrichtung.personengruppe];
            console.log('Ziel-Liste für', einrichtung.personengruppe, ':', targetListId);
            
            const targetList = document.getElementById(targetListId);
            if (targetList) {
                targetList.appendChild(card);
            } else {
                console.error('Liste nicht gefunden für Personengruppe:', einrichtung.personengruppe);
            }
        });
    } catch (error) {
        console.error('Fehler beim Laden der Einrichtungen:', error);
        showToast('Fehler beim Laden der Einrichtungen');
    }
}

function createEinrichtungCard(einrichtung) {
    const div = document.createElement('div');
    div.className = 'einrichtung-card';

    const fullName = `${einrichtung.name} ${einrichtung.kuerzel || ''}`.trim();
    const fileId = fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    div.innerHTML = `
        <span>${einrichtung.name}</span>
        <div class="card-buttons">
            <button class="edit-btn" data-file-id="${fileId}" data-display-name="${einrichtung.name}">
                Bearbeiten
            </button>
            <button class="delete-btn" data-file-id="${fileId}" data-display-name="${einrichtung.name}">
                Löschen
            </button>
        </div>
    `;

    // Event Listener für Buttons
    div.querySelector('.edit-btn').addEventListener('click', () => {
        editEinrichtung(fileId, einrichtung.name);
    });

    div.querySelector('.delete-btn').addEventListener('click', async () => {
        if (confirm(`Möchten Sie die Einrichtung "${einrichtung.name}" wirklich löschen?`)) {
            try {
                const response = await fetch(`http://localhost:8086/api/einrichtungen/${fileId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Fehler beim Löschen der Einrichtung');
                }

                showToast('Einrichtung erfolgreich gelöscht');
                await loadEinrichtungen();
            } catch (error) {
                console.error('Fehler beim Löschen:', error);
                showToast('Fehler: ' + error.message);
            }
        }
    });

    return div;
}
