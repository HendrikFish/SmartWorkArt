const BASE_URL = "https://smartworkart.onrender.com"; // Einheitliche Basis-URL für alle APIs

document.addEventListener('DOMContentLoaded', () => {
    fetchKategorien();
});

async function fetchKategorien() {
    try {
        const response = await fetch(`${BASE_URL}/api/datenbank/kategorien`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const kategorien = await response.json();
        const container = document.getElementById('kategorien-container');

        kategorien.forEach(kategorie => {
            const kategorieDiv = document.createElement('div');
            kategorieDiv.className = 'kategorie';
            kategorieDiv.innerHTML = `
                <div class="kategorie-header">
                    <h2>${kategorie}</h2>
                    <span class="dropdown-arrow">▼</span>
                </div>
                <div class="kategorie-content" style="display: none;"></div>
            `;

            const headerDiv = kategorieDiv.querySelector('.kategorie-header');
            const contentDiv = kategorieDiv.querySelector('.kategorie-content');
            const arrowSpan = kategorieDiv.querySelector('.dropdown-arrow');

            headerDiv.addEventListener('click', async (e) => {
                // Prüfe auf ungespeicherte Änderungen in allen Rezepten
                const hasUnsavedChanges = await checkUnsavedChanges();
                if (hasUnsavedChanges) {
                    if (!confirm('Es gibt ungespeicherte Änderungen. Möchten Sie fortfahren? Nicht gespeicherte Änderungen gehen verloren.')) {
                        return;
                    }
                }

                // Schließe alle anderen Kategorien
                document.querySelectorAll('.kategorie-content').forEach(content => {
                    if (content !== contentDiv && content.style.display === 'block') {
                        content.style.display = 'none';
                        content.parentElement.querySelector('.dropdown-arrow').textContent = '▼';
                        resetAllValues(content);
                    }
                });

                const isHidden = contentDiv.style.display === 'none';
                contentDiv.style.display = isHidden ? 'block' : 'none';
                arrowSpan.textContent = isHidden ? '▲' : '▼';

                if (!isHidden) {
                    resetAllValues(contentDiv);
                }

                if (isHidden && contentDiv.children.length === 0) {
                    fetchRezepte(kategorie, contentDiv);
                }
            });

            container.appendChild(kategorieDiv);
        });
    } catch (error) {
        console.error('Fehler beim Abrufen der Kategorien:', error);
        document.getElementById('kategorien-container').innerHTML = 
            '<p class="error">Fehler beim Laden der Kategorien.</p>';
    }
}

// Hilfsfunktion zum Prüfen auf ungespeicherte Änderungen
async function checkUnsavedChanges() {
    const allRezeptContents = document.querySelectorAll('.rezept-content');
    for (const content of allRezeptContents) {
        if (content.dataset.hasChanges === 'true') {
            return true;
        }
    }
    return false;
}

// Funktion zum Zurücksetzen aller Werte in einem Container
function resetAllValues(container) {
    const allRezeptContents = container.querySelectorAll('.rezept-content');
    allRezeptContents.forEach(content => {
        if (content.dataset.hasChanges === 'true') {
            resetValues(content);
        }
    });
}

async function fetchRezepte(kategorie, contentDiv) {
    try {
        const response = await fetch(`${BASE_URL}/api/datenbank/rezepte/${kategorie}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rezepte = await response.json();
        
        if (rezepte.length === 0) {
            contentDiv.innerHTML = '<p class="info">Keine Rezepte vorhanden</p>';
            return;
        }

        rezepte.forEach(rezept => {
            const rezeptDiv = document.createElement('div');
            rezeptDiv.className = 'rezept';
            const originalValues = {};

            rezeptDiv.innerHTML = `
                <div class="rezept-header">
                    <h3>${rezept.name}</h3>
                    <span class="dropdown-arrow">▼</span>
                </div>
                <div class="rezept-content" style="display: none;">
                    <div class="rezept-layout">
                        <div class="rezept-left">
                            <div class="zutaten"></div>
                            <div class="button-container">
                                <button class="update-btn" style="display: none;">Änderungen speichern</button>
                                <button class="delete-btn">Löschen</button>
                            </div>
                        </div>
                        <div class="rezept-right">
                            <div class="info-container">
                                <label for="info-${rezept.rezeptId}">Infos:</label>
                                <textarea 
                                    id="info-${rezept.rezeptId}"
                                    class="info-text"
                                    data-original-value="${rezept.infos || ''}"
                                >${rezept.infos || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Event-Listener für Info-Textarea
            const infoTextarea = rezeptDiv.querySelector('.info-text');
            infoTextarea.addEventListener('input', function() {
                const rezeptContent = this.closest('.rezept-content');
                const updateBtn = rezeptContent.querySelector('.update-btn');
                updateBtn.style.display = 'inline-block';
                rezeptContent.dataset.hasChanges = 'true';
            });

            const rezeptHeader = rezeptDiv.querySelector('.rezept-header');
            const rezeptContent = rezeptDiv.querySelector('.rezept-content');
            const rezeptArrow = rezeptDiv.querySelector('.dropdown-arrow');

            rezeptHeader.addEventListener('click', async (e) => {
                if (e.target.closest('.button-container')) {
                    return;
                }

                const isHidden = rezeptContent.style.display === 'none';
                
                if (!isHidden && rezeptContent.dataset.hasChanges === 'true') {
                    const shouldSave = await customConfirm('Es gibt ungespeicherte Änderungen. Was möchten Sie tun?');
                    if (shouldSave) {
                        saveChanges(kategorie, rezept.rezeptId, rezeptContent);
                    } else {
                        resetValues(rezeptContent);
                    }
                }

                rezeptContent.style.display = isHidden ? 'block' : 'none';
                rezeptArrow.textContent = isHidden ? '▲' : '▼';

                if (isHidden && !rezeptContent.querySelector('.zutaten').children.length) {
                    const zutatenDiv = rezeptContent.querySelector('.zutaten');
                    rezept.zutaten.forEach(zutat => {
                        originalValues[zutat.id] = zutat.menge;
                        const zutatDiv = document.createElement('div');
                        zutatDiv.className = 'zutat';
                        zutatDiv.innerHTML = `
                            <span>${zutat.name}</span>
                            <input type="number" 
                                   value="${zutat.menge}"
                                   data-zutat-id="${zutat.id}"
                                   data-original-value="${zutat.menge}"
                            /> ${zutat.verwendungseinheit || ''}
                            <span class="zutat-preis">Preis pro ${zutat.basiseinheit}: ${zutat.preisProBasiseinheit.toFixed(2)} €</span>
                        `;
                        
                        // Event-Listener für Mengen-Input
                        const input = zutatDiv.querySelector('input');
                        input.addEventListener('input', function() {
                            const rezeptContent = this.closest('.rezept-content');
                            const updateBtn = rezeptContent.querySelector('.update-btn');
                            updateBtn.style.display = 'inline-block';
                            rezeptContent.dataset.hasChanges = 'true';
                        });
                        
                        zutatenDiv.appendChild(zutatDiv);
                    });
                }
            });

            rezeptContent.querySelector('.delete-btn').addEventListener('click', () => {
                deleteRezept(kategorie, rezept.rezeptId);
            });

            rezeptContent.querySelector('.update-btn').addEventListener('click', () => {
                saveChanges(kategorie, rezept.rezeptId, rezeptContent);
            });

            contentDiv.appendChild(rezeptDiv);
        });
    } catch (error) {
        console.error(`Fehler beim Abrufen der Rezepte für Kategorie ${kategorie}:`, error);
        contentDiv.innerHTML = '<p class="info">Keine Rezepte vorhanden</p>';
    }
}

// Funktion für Toast-Benachrichtigung
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animation starten
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // Toast nach 3 Sekunden ausblenden und entfernen
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Anpassen der saveChanges Funktion
async function saveChanges(kategorie, rezeptId, rezeptContent) {
    const inputs = rezeptContent.querySelectorAll('input[type="number"]');
    const infoText = rezeptContent.querySelector('.info-text').value;
    
    const zutaten = Array.from(inputs).map(input => ({
        id: parseInt(input.dataset.zutatId),
        menge: parseFloat(input.value)
    }));

    try {
        const response = await fetch(`${BASE_URL}/api/datenbank/rezepte/${kategorie}/${rezeptId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                zutaten,
                infos: infoText
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Aktualisieren');
        }

        rezeptContent.dataset.hasChanges = 'false';
        rezeptContent.querySelector('.update-btn').style.display = 'none';
        showToast('Änderungen wurden erfolgreich gespeichert!');
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showToast('Fehler beim Speichern der Änderungen', 'error');
    }
}

// Funktion zum Zurücksetzen der Werte
function resetValues(rezeptContent) {
    // Zurücksetzen der Mengen-Inputs
    const inputs = rezeptContent.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        const originalValue = input.getAttribute('data-original-value');
        input.value = originalValue;
    });

    // Zurücksetzen des Info-Texts
    const infoTextarea = rezeptContent.querySelector('.info-text');
    const originalInfo = infoTextarea.getAttribute('data-original-value');
    infoTextarea.value = originalInfo || '';

    // Zurücksetzen des Änderungsstatus
    rezeptContent.dataset.hasChanges = 'false';
    rezeptContent.querySelector('.update-btn').style.display = 'none';
}

async function deleteRezept(kategorie, rezeptId) {
    if (!confirm('Möchten Sie dieses Rezept wirklich löschen?')) {
        return;
    }
    if (!confirm('Sind Sie sich WIRKLICH sicher? Diese Aktion kann nicht rückgängig gemacht werden!')) {
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/datenbank/rezepte/${kategorie}/${rezeptId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Fehler beim Löschen des Rezepts');
        }
        // Seite neu laden nach erfolgreichem Löschen
        location.reload();
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen des Rezepts');
    }
}

// Funktion für benutzerdefinierten Dialog
function customConfirm(message) {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'custom-dialog-overlay';
        dialog.innerHTML = `
            <div class="custom-dialog">
                <p>${message}</p>
                <div class="custom-dialog-buttons">
                    <button class="custom-dialog-btn save-btn">Speichern</button>
                    <button class="custom-dialog-btn cancel-btn">Verwerfen</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.save-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(true);
        });

        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(false);
        });
    });
}
