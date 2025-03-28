import { Toast } from './module.js';
import { OCRManager } from './ocr.js';
import { Modal } from './modal.js';

export const UploadManager = {
    // Kamera-Stream und aktuelle Kamera
    currentStream: null,
    currentFacingMode: 'environment', // 'user' für Frontkamera, 'environment' für Rückkamera (Standardeinstellung für Dokumente)

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
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('cameraPreview');
            if (video) {
                video.srcObject = stream;
                
                // Warte, bis das Video geladen ist
                await new Promise(resolve => {
                    video.onloadedmetadata = () => {
                        resolve();
                    };
                });
                
                video.play();
            }
            
            // Speichere Stream für spätere Referenz
            this.currentStream = stream;
            
            // Passe die UI für Smartphones an
            this.adjustCameraUIForMobile();
            
            console.log(`Kamera initialisiert mit Modus: ${this.currentFacingMode}`);
            return stream;
        } catch (error) {
            console.error('Fehler beim Initialisieren der Kamera:', error);
            Toast.show('Fehler beim Zugriff auf die Kamera', 'error');
            return null;
        }
    },

    adjustCameraUIForMobile() {
        if (this.isMobileDevice()) {
            // Verstärke den Rahmen und die Anleitung für Mobilgeräte
            const frame = document.querySelector('.ocr-frame');
            const container = document.querySelector('.camera-container');
            
            // Füge Hinweistext hinzu
            if (container && !document.querySelector('.camera-hint')) {
                const hint = document.createElement('div');
                hint.className = 'camera-hint';
                hint.textContent = 'Dokument innerhalb des Rahmens positionieren';
                container.appendChild(hint);
            }
            
            // Verbesserte visuelle Hilfe bei der Rahmenerkennung
            if (frame) {
                frame.classList.add('mobile-frame');
                
                // Eckpunkte für bessere visuelle Orientierung
                const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
                
                corners.forEach(corner => {
                    if (!document.querySelector(`.corner-${corner}`)) {
                        const cornerElement = document.createElement('div');
                        cornerElement.className = `corner corner-${corner}`;
                        frame.appendChild(cornerElement);
                    }
                });
            }
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
            
            // Verwende die tatsächliche Auflösung des Video-Streams
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0);
            
            // Zeige Lade-Overlay an
            this.showLoadingOverlay();
            
            return new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/jpeg', 0.95); // Höhere Qualität für bessere OCR-Ergebnisse
            });
        } catch (error) {
            console.error('Fehler beim Erfassen des Bildes:', error);
            Toast.show('Fehler beim Erfassen des Bildes', 'error');
            this.hideLoadingOverlay();
            return null;
        }
    },

    showLoadingOverlay() {
        // Erstelle Lade-Overlay, falls noch nicht vorhanden
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Text wird erkannt...</div>
            `;
            document.body.appendChild(overlay);
        }
        
        // Zeige das Overlay an
        overlay.style.display = 'flex';
    },
    
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    validateFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            Toast.show('Nur Bilder im Format JPG oder PNG sind erlaubt', 'error');
            return false;
        }

        if (file.size > maxSize) {
            Toast.show('Die Datei darf nicht größer als 10MB sein', 'error');
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
    
    async openFileDialog() {
        try {
            console.log('Öffne Datei-Dialog');
            const input = this.createFileInput();
            
            input.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file && this.validateFile(file)) {
                    try {
                        // Zeige Lade-Overlay an
                        this.showLoadingOverlay();
                        
                        // Verarbeite das Bild mit OCRManager
                        await OCRManager.processImage(file);
                        
                        // Verstecke Lade-Overlay
                        this.hideLoadingOverlay();
                    } catch (error) {
                        console.error('Fehler bei der Bildverarbeitung:', error);
                        Toast.show('Fehler bei der Bildverarbeitung', 'error');
                        this.hideLoadingOverlay();
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
            this.hideLoadingOverlay();
        }
    },

    // Hook, um den OCR-Prozess nach dem Aufnahme-Button zu starten
    async processImageFromCamera() {
        const imageBlob = await this.captureImage();
        if (imageBlob) {
            try {
                // Verstecke Kamera-Modal erst nachdem OCR abgeschlossen ist
                Modal.hide('cameraModal');
                
                // Verarbeite das Bild mit OCRManager (Overlay bereits angezeigt)
                await OCRManager.processImage(imageBlob);
                
                // Verstecke Lade-Overlay
                this.hideLoadingOverlay();
            } catch (error) {
                console.error('Fehler bei der OCR-Verarbeitung:', error);
                Toast.show('Fehler bei der OCR-Verarbeitung', 'error');
                this.hideLoadingOverlay();
            }
        }
    }
}; 