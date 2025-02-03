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

    prepareResidentData(formData) {
        const residentData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            gender: formData.get('gender'),
            areas: {}
        };

        formData.forEach((value, key) => {
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
            const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
            const response = await fetch(`/api/solo/resident/dismiss/${normalizedName}`, {
                method: 'POST'
            });

            if (response.ok) {
                Toast.show('Bewohner erfolgreich entlassen', 'success');
                Modal.hideAll();
                return true;
            } else {
                const error = await response.json();
                Toast.show('Fehler beim Entlassen: ' + (error.error || 'Unbekannter Fehler'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Entlassen:', error);
            Toast.show('Fehler beim Entlassen des Bewohners', 'error');
            return false;
        }
    },

    async resurrectResident(resident) {
        try {
            const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
            const response = await fetch(`/api/solo/resident/resurrect/${normalizedName}`, {
                method: 'POST'
            });

            if (response.ok) {
                Toast.show('Bewohner erfolgreich wiederhergestellt', 'success');
                Modal.hide('resurrectionModal');
                return true;
            } else {
                const error = await response.json();
                Toast.show('Fehler bei der Wiederherstellung: ' + (error.error || 'Unbekannter Fehler'), 'error');
                return false;
            }
        } catch (error) {
            console.error('Fehler bei der Wiederherstellung:', error);
            Toast.show('Fehler bei der Wiederherstellung des Bewohners', 'error');
            return false;
        }
    }
}; 