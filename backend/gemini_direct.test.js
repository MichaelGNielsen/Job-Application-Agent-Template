/**
 * Direkte test af Gemini CLI integration (v4.8.0)
 */
const { callLocalGemini } = require('./ai_service');
const logger = require('./logger');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootDir = '/app/shared';
dotenv.config({ path: path.join(rootDir, '.env') });

describe('Gemini Direct Integration', () => {
    test('bør kunne kalde Gemini og få et svar', async () => {
        // Vi skipper testen hvis der ikke er en API nøgle (f.eks. i begrænset CI)
        if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
            console.log('Skipping Gemini test: No API key found');
            return;
        }

        const prompt = "Svar med ordet 'MGN_TEST_OK' og intet andet.";
        const response = await callLocalGemini(prompt, 'direct-test', logger);
        
        expect(response.trim()).toContain('MGN_TEST_OK');
    }, 30000); // 30 sek timeout
});
