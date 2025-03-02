const SoloPlanModel = require('../models/soloPlanModels');
const path = require('path');
const fs = require('fs').promises;

class SoloPlanController {
    static async getResidents(req, res) {
        try {
            const residents = await SoloPlanModel.getAllResidents();
            res.json(residents);
        } catch (error) {
            console.error('Controller-Fehler:', error);
            res.status(500).json({
                error: 'Interner Serverfehler beim Laden der Bewohner'
            });
        }
    }

    static async getMenu(req, res) {
        try {
            const { year, week } = req.params;
            const menuData = await SoloPlanModel.getMenuData(year, week);
            
            if (menuData.status === 'empty') {
                return res.status(404).json(menuData);
            }
            
            res.json(menuData);
        } catch (error) {
            console.error('Controller-Fehler beim Laden des Menüs:', error);
            res.status(500).json({
                status: 'error',
                message: 'Interner Serverfehler beim Laden des Menüs',
                error: error.message
            });
        }
    }

    static async getResidentSelections(req, res) {
        try {
            const { year, week, resident } = req.params;
            const dirPath = path.join(__dirname, '..', 'data', 'soloPlan', year, `KW${week}`);
            const filePath = path.join(dirPath, `${resident}.json`);
            
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                return res.json(JSON.parse(content));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return res.json({}); // Keine Auswahl vorhanden
                }
                throw error;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Bewohnerauswahl:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Auswahl' });
        }
    }

    static async saveResidentSelections(req, res) {
        try {
            const { year, week, resident } = req.params;
            const selections = req.body;
            
            const selectionsWithResident = {
                resident: resident,
                ...selections
            };
            
            await SoloPlanModel.saveResidentSelections(year, week, resident, selectionsWithResident);
            res.json({ status: 'success' });
        } catch (error) {
            console.error('Fehler beim Speichern der Bewohnerauswahl:', error);
            res.status(500).json({ error: 'Fehler beim Speichern' });
        }
    }

    static async getShorts(req, res) {
        try {
            const shortsPath = path.join(__dirname, '..', 'data', 'soloPlan', 'short', 'shorts.json');
            const shortsData = await fs.readFile(shortsPath, 'utf8');
            const shorts = JSON.parse(shortsData);
            res.json(shorts);
        } catch (error) {
            console.error('Fehler beim Laden der Alternativen:', error);
            res.status(500).json({ 
                message: 'Fehler beim Laden der Alternativen',
                error: error.message 
            });
        }
    }

    static async deleteResidentSelections(req, res) {
        try {
            const { year, week, resident } = req.params;
            const filePath = path.join(__dirname, '..', 'data', 'soloPlan', year, `KW${week}`, `${resident}.json`);
            
            try {
                await fs.unlink(filePath);
                res.json({ message: 'Wochenplan erfolgreich gelöscht' });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    res.json({ message: 'Wochenplan wurde bereits gelöscht oder existiert nicht' });
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Wochenplans:', error);
            res.status(500).json({ 
                message: 'Fehler beim Löschen des Wochenplans',
                error: error.message 
            });
        }
    }

    static async checkExistingData(req, res) {
        try {
            const { year, week, resident } = req.params;
            const result = await SoloPlanModel.checkExistingData(year, week, resident);
            res.json(result);
        } catch (error) {
            console.error('Fehler beim Prüfen vorhandener Daten:', error);
            res.status(500).json({ error: 'Serverinterner Fehler beim Prüfen vorhandener Daten' });
        }
    }

    static async getExtraCategories(req, res) {
        try {
            const extraCategories = await SoloPlanModel.getExtraCategories();
            res.json(extraCategories);
        } catch (error) {
            console.error('Fehler beim Laden der Extra-Kategorien:', error);
            res.status(500).json({ error: 'Serverinterner Fehler beim Laden der Extra-Kategorien' });
        }
    }

    static async saveExtraCategories(req, res) {
        try {
            const extraCategories = req.body;
            await SoloPlanModel.saveExtraCategories(extraCategories);
            res.json({ success: true, message: 'Extra-Kategorien erfolgreich gespeichert' });
        } catch (error) {
            console.error('Fehler beim Speichern der Extra-Kategorien:', error);
            res.status(500).json({ error: 'Serverinterner Fehler beim Speichern der Extra-Kategorien' });
        }
    }
}

module.exports = SoloPlanController;
