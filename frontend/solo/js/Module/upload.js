import { Toast } from './module.js';
import { OCRManager } from './ocr.js';

export const UploadManager = {
    // Kamera-Stream und aktuelle Kamera
    currentStream: null,
    currentFacingMode: 'user', // 'user' für Frontkamera, 'environment' für Rückkamera

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    isTabletDevice() {
        return /iPad|Android/i.test(navigator.userAgent) && !this.isMobileDevice();
    },

    async initializeCamera() {
        try {
            // Stoppt vorherigen Stream, falls vorhanden
            if (this.currentStream) {
                this.stopCamera(this.currentStream);
            }

            // Konfiguriere Kamera mit aktueller Ausrichtung
            const constraints = { 
                video: { 
                    facingMode: this.currentFacingMode 
                } 
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('cameraPreview');
            if (video) {
                video.srcObject = stream;
            }
            
            // Speichere Stream für spätere Referenz
            this.currentStream = stream;
            
            console.log(`Kamera initialisiert mit Modus: ${this.currentFacingMode}`);
            return stream;
        } catch (error) {
            console.error('Fehler beim Initialisieren der Kamera:', error);
            Toast.show('Fehler beim Zugriff auf die Kamera', 'error');
            return null;
        }
    },

    stopCamera(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    },

    async switchCamera() {
        try {
            // Wechsle zwischen Front- und Rückkamera
            this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
            console.log(`Wechsel Kamera zu: ${this.currentFacingMode}`);
            
            // Initialisiere Kamera neu mit neuer Ausrichtung
            await this.initializeCamera();
            
            Toast.show(`Kamera gewechselt zu ${this.currentFacingMode === 'user' ? 'Frontkamera' : 'Rückkamera'}`, 'info');
        } catch (error) {
            console.error('Fehler beim Wechseln der Kamera:', error);
            Toast.show('Fehler beim Wechseln der Kamera', 'error');
        }
    },

    async captureImage() {
        try {
            const video = document.getElementById('cameraPreview');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0);
            
            return new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.8);
            });
        } catch (error) {
            console.error('Fehler beim Erfassen des Bildes:', error);
            Toast.show('Fehler beim Erfassen des Bildes', 'error');
            return null;
        }
    },

    validateFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
            Toast.show('Nur Bilder im Format JPG oder PNG sind erlaubt', 'error');
            return false;
        }

        if (file.size > maxSize) {
            Toast.show('Die Datei darf nicht größer als 5MB sein', 'error');
            return false;
        }

        return true;
    },

    createFileInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
    },
    
    openFileDialog() {
        try {
            console.log('Öffne Datei-Dialog');
            const input = this.createFileInput();
            
            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file && this.validateFile(file)) {
                    try {
                        // Verarbeite das Bild mit OCRManager
                        await OCRManager.processImage(file);
                    } catch (error) {
                        console.error('Fehler bei der Bildverarbeitung:', error);
                        Toast.show('Fehler bei der Bildverarbeitung', 'error');
                    }
                }
                
                // Entferne das Input-Element nach der Verarbeitung
                document.body.removeChild(input);
            });
            
            // Löse den Klick aus, um den Datei-Dialog zu öffnen
            input.click();
        } catch (error) {
            console.error('Fehler beim Öffnen des Datei-Dialogs:', error);
            Toast.show('Fehler beim Öffnen des Datei-Dialogs', 'error');
        }
    }
}; 