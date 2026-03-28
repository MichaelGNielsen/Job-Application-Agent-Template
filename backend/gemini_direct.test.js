/**
 * Integrationstest for direkte Gemini API kald.
 * Denne test kører uden mocks for at verificere den faktiske forbindelse.
 */

const { callLocalGemini } = require('./utils');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Indlæs miljøvariabler fra .env (ligger i delt mappe i Docker)
dotenv.config({ path: path.join(__dirname, 'shared/.env') });

// Hvis den ikke findes der, så tjek rodmappen (lokal kørsel)
if (!process.env.GEMINI_API_KEY) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
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
    }, 600000); // 10 minutters timeout for AI kald

    test('skal kunne opdatere Brutto-CV for Tintin (Update Master CV Test)', async () => {
        if (!process.env.GOOGLE_API_KEY) {
            console.warn('Skipping test: Ingen GOOGLE_API_KEY fundet.');
            return;
        }

        console.log('--- Starter Tintin CV Update test ---');
        
        // En fokuseret og ikke for stor CV til testen
        const smallCv = `# Brutto CV - Tintin
## Personlige oplysninger
- Navn: Tintin
- Adresse: Slottet Møllenborg, 1000 Bruxelles
- Email: reporter@moulin-le-chateau.be

## Erhvervserfaring
**Undersøgende Journalist | Le Petit Vingtième (1929 - nu)**
- Ledet ekspeditioner til fjerntliggende egne som Tibet, Congo og det ydre rum.
- Afdækket omfattende narkotikasmugling i Orienten og Sydamerika.`;

        const newExperience = {
            title: 'Senior AI Specialist',
            company: 'Future Labs',
            period: '2025 - nu',
            description: 'Implementering af AI-agenter til undersøgende journalistik og prompt engineering.'
        };

        const prompt = `Her er et Brutto-CV (kilde til sandhed):
"""${smallCv}"""

DIN OPGAVE: Tilføj følgende nye erhvervserfaring til CV'et:
- Titel: ${newExperience.title}
- Firma: ${newExperience.company}
- Periode: ${newExperience.period}
- Beskrivelse: ${newExperience.description}

REGLER:
1. Returner det KOMPLETTE opdaterede Brutto-CV i Markdown.
2. Bevar den eksisterende struktur og stil.
3. Placer den nye erfaring øverst under 'Erhvervserfaring' da det er den nyeste.
4. Svar KUN med det opdaterede Markdown.`;

        try {
            const response = await callLocalGemini(prompt, 'unit_test_tintin_update');
            console.log('Opdateret CV:', response);
            
            expect(response).toBeDefined();
            expect(response).toContain(newExperience.title);
            expect(response).toContain(newExperience.company);
            expect(response).toContain('Le Petit Vingtième'); // Tjek at gammel info bevares
        } catch (error) {
            console.error('Tintin CV Update test fejlede:', error.message);
            throw error;
        }
    }, 600000); // 10 minutters timeout for AI kald
});
