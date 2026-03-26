/**
 * Integrationstest for direkte Gemini API kald.
 * Denne test kører uden mocks for at verificere den faktiske forbindelse.
 */

const { callLocalGemini } = require('./utils');
const dotenv = require('dotenv');
const path = require('path');

// Indlæs miljøvariabler fra .env_ai (ligger i delt mappe i Docker)
dotenv.config({ path: path.join(__dirname, 'shared/.env_ai') });

// Hvis den ikke findes der, så tjek rodmappen (lokal kørsel)
if (!process.env.GEMINI_API_KEY) {
    dotenv.config({ path: path.join(__dirname, '../.env_ai') });
}

describe('Gemini Direct Integration Test', () => {
    
    // Vi mapper nøglen ligesom i server.js/worker.js
    if (process.env.GEMINI_API_KEY) {
        process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
    }

    test('skal kunne modtage et svar fra Gemini API (Direct Call)', async () => {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn('Skipping test: Ingen GOOGLE_API_KEY fundet.');
            return;
        }

        console.log('--- Starter direkte API test ---');
        const prompt = 'Svar kun med ordet "OK" hvis du modtager dette.';
        
        try {
            const response = await callLocalGemini(prompt, 'unit_test_direct');
            console.log('AI Respons:', response);
            
            expect(response).toBeDefined();
            expect(response.trim().toUpperCase()).toContain('OK');
        } catch (error) {
            console.error('Test fejlede:', error.message);
            throw error;
        }
    }, 30000); // 30 sekunders timeout for AI kald
});
