import { Modal } from './modal.js';
import { Toast, normalizeString } from './module.js';

export const SaveManager = {
    async saveResident(formData, isNew = true) {
        try {
            const residentData = this.prepareResidentData(formData);
            const url = isNew ? '/api/solo/resident' : `/api/solo/resident/${normalizeString(residentData.firstName)}_${normalizeString(residentData.lastName)}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(residentData)
            });

            if (response.ok) {
                Toast.show(`Bewohner erfolgreich ${isNew ? 'gespeichert' : 'aktualisiert'}`, 'success');
                Modal.hide(isNew ? 'newResidentForm' : 'residentDetailModal');
                return true;
            } else {
                const error = await response.json();
                Toast.show('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            Toast.show('Fehler beim Speichern des Bewohners', 'error');
            return false;
        }
    },

    prepareResidentData(data) {
        // Wenn data bereits ein Objekt ist, geben wir es direkt zurück
        if (typeof data === 'object' && !(data instanceof FormData)) {
            return {
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender || '',
                areas: data.areas || {}
            };
        }

        // Wenn es FormData ist, verarbeiten wir es wie bisher
        const residentData = {
            firstName: data.get('firstName'),
            lastName: data.get('lastName'),
            gender: data.get('gender'),
            areas: {}
        };

        data.forEach((value, key) => {
            if (!['firstName', 'lastName', 'gender'].includes(key)) {
                if (key.startsWith('area_')) {
                    const areaName = key.replace('area_', '');
                    if (value) {
                        residentData.areas[areaName] = value;
                    }
                } else {
                    residentData[key] = value;
                }
            }
        });

        return residentData;
    },

    async dismissResident(resident) {
        try {
            // Zunächst aktualisieren wir den Bewohner mit dem Todesdatum
            const todesdatum = new Date().toISOString().split('T')[0];  // Format YYYY-MM-DD
            console.log(`Setze Todesdatum ${todesdatum} für Bewohner ${resident.firstName} ${resident.lastName}`);
            
            const updatedResident = {
                ...resident,
                todesdatum: todesdatum
            };
            
            console.log('Aktualisierter Bewohner:', updatedResident);
            
            // Aktualisiere den Bewohner zuerst mit dem Todesdatum
            const updateUrl = `/api/solo/resident/${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
            const updateResponse = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedResident)
            });
            
            if (!updateResponse.ok) {
                const error = await updateResponse.json();
                throw new Error('Fehler beim Aktualisieren des Todesdatums: ' + (error.error || 'Unbekannter Fehler'));
            }
            
            console.log('Todesdatum erfolgreich gespeichert');

            // Dann verschieben wir den Bewohner in den Old-Ordner
            const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
            const response = await fetch(`/api/solo/resident/dismiss/${normalizedName}`, {
                method: 'POST'
            });

            if (response.ok) {
                Toast.show('Bewohner erfolgreich entlassen', 'success');
                // Stelle sicher, dass alle offenen Modals geschlossen werden
                Modal.hideAll();
                // Warte kurz, um sicherzustellen, dass das Modal-Schließen abgeschlossen ist
                await new Promise(resolve => setTimeout(resolve, 300));
                return true;
            } else {
                const error = await response.json();
                Toast.show('Fehler beim Entlassen: ' + (error.error || 'Unbekannter Fehler'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Entlassen:', error);
            Toast.show('Fehler beim Entlassen des Bewohners: ' + error.message, 'error');
            return false;
        }
    },

    async resurrectResident(resident) {
        try {
            console.log('Wiederherstellung wird versucht für:', resident);
            const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
            console.log('Normalisierter Name:', normalizedName);
            
            // Entferne zuerst das Todesdatum aus den Bewohnerdaten
            if (resident.todesdatum) {
                console.log('Entferne Todesdatum bei Wiederauferstehung');
                const updatedResident = { ...resident };
                delete updatedResident.todesdatum;
                
                // Verschiebe den Bewohner zurück
                const response = await fetch(`/api/solo/resident/resurrect/${normalizedName}`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`Fehler beim Wiederherstellen: ${response.status}`);
                }
                
                // Nach der Wiederherstellung aktualisiere den Bewohner, um das Todesdatum zu entfernen
                const updateUrl = `/api/solo/resident/${normalizedName}`;
                const updateResponse = await fetch(updateUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedResident)
                });
                
                if (!updateResponse.ok) {
                    console.warn('Todesdatum konnte nicht entfernt werden, aber Bewohner wurde wiederhergestellt');
                } else {
                    console.log('Todesdatum erfolgreich entfernt');
                }
            } else {
                // Wenn kein Todesdatum vorhanden ist, verschiebe den Bewohner einfach zurück
                const response = await fetch(`/api/solo/resident/resurrect/${normalizedName}`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    throw new Error(`Fehler beim Wiederherstellen: ${response.status}`);
                }
            }
            
            Toast.show('Bewohner erfolgreich wiederhergestellt', 'success');
            Modal.hide('resurrectionModal');
            return true;
        } catch (error) {
            console.error('Fehler bei der Wiederherstellung:', error);
            Toast.show('Fehler bei der Wiederherstellung des Bewohners: ' + error.message, 'error');
            return false;
        }
    }
}; 