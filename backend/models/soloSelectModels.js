const fs = require('fs').promises;
const path = require('path');

// Helper function to create directory if it doesn't exist
async function createDirectoryIfNotExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.mkdir(dirPath, { recursive: true });
        } else {
            throw error;
        }
    }
}

// Helper function to validate plan data
function validatePlanData(planData) {
    if (!planData || typeof planData !== 'object') {
        return false;
    }

    // Check for required properties in plan data
    const requiredProperties = ['resident'];
    for (const prop of requiredProperties) {
        if (!(prop in planData)) {
            return false;
        }
    }

    return true;
}

// Helper function to format plan data for saving
function formatPlanData(planData) {
    // Deep clone the data
    const formattedData = JSON.parse(JSON.stringify(planData));

    // Ensure all meal entries have required properties
    Object.keys(formattedData).forEach(key => {
        if (key !== 'resident' && typeof formattedData[key] === 'object') {
            const entry = formattedData[key];
            entry.selected = entry.selected || false;
            entry.portion = entry.portion || '100%';
            entry.meals = entry.meals || [];
            entry.comments = entry.comments || [];
            entry.alternatives = entry.alternatives || [];
        }
    });

    return formattedData;
}

// Helper function to merge plan data with existing data
async function mergePlanData(existingPath, newData) {
    try {
        const existingData = await fs.readFile(existingPath, 'utf8')
            .then(data => JSON.parse(data))
            .catch(() => ({}));

        return {
            ...existingData,
            ...newData,
            resident: newData.resident || existingData.resident
        };
    } catch (error) {
        console.error('Error merging plan data:', error);
        return newData;
    }
}

module.exports = {
    createDirectoryIfNotExists,
    validatePlanData,
    formatPlanData,
    mergePlanData
};
