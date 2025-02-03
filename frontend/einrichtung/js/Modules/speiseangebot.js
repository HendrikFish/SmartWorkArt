// public/js/modules/speiseangebot.js

// Setup des Speiseangebots (Schritt 3)
export function setupSpeiseangebot() {
    const container = document.querySelector('[data-step="3"]');
    if (!container) return;

    container.innerHTML = `
        <h3>Speiseangebot</h3>
        <div id="speiseangebot" class="speiseangebot-container">
            <!-- Tage werden hier dynamisch eingefügt -->
        </div>
    `;

    const speiseContainer = container.querySelector('#speiseangebot');
    const wochentage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    
    wochentage.forEach(tag => {
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-container';
        tagDiv.innerHTML = `
            <div class="tag-name">${tag}</div>
            <div class="tag-options">
                <label>
                    <input type="checkbox" class="master-option" data-tag="${tag}">
                    Alle
                </label>
                <label>
                    <input type="checkbox" class="speise-option" data-tag="${tag}" data-type="suppe">
                    Suppe
                </label>
                <label>
                    <input type="checkbox" class="speise-option" data-tag="${tag}" data-type="hauptspeise">
                    Hauptspeise
                </label>
                <label>
                    <input type="checkbox" class="speise-option" data-tag="${tag}" data-type="dessert">
                    Dessert
                </label>
            </div>
        `;
        speiseContainer.appendChild(tagDiv);

        const masterCheckbox = tagDiv.querySelector('.master-option');
        const optionCheckboxes = tagDiv.querySelectorAll('.speise-option');
        
        // "Alle" Checkbox
        masterCheckbox.addEventListener('change', (e) => {
            optionCheckboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });

        // Einzelne Optionen
        optionCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(optionCheckboxes).every(cb => cb.checked);
                masterCheckbox.checked = allChecked;
            });
        });
    });
}

// Sammeln der Daten
export function getSpeiseangebotData() {
    const speiseangebot = [];
    document.querySelectorAll('.tag-container').forEach(container => {
        const tag = container.querySelector('.tag-name').textContent;
        const masterOption = container.querySelector('.master-option').checked;
        const suppe = container.querySelector('.speise-option[data-type="suppe"]').checked;
        const hauptspeise = container.querySelector('.speise-option[data-type="hauptspeise"]').checked;
        const dessert = container.querySelector('.speise-option[data-type="dessert"]').checked;

        speiseangebot.push({
            tag,
            alleOptionen: masterOption,
            suppe,
            hauptspeise,
            dessert
        });
    });
    console.log('Gesammeltes Speiseangebot:', speiseangebot);
    return speiseangebot;
}
