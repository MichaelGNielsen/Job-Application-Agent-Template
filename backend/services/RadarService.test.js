const RadarService = require('./RadarService');
const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('RadarService', () => {
    let radarService;
    const mockRootDir = path.join(__dirname, '..');
    
    beforeEach(() => {
        const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        radarService = new RadarService({
            logger,
            fs,
            path,
            fetch: jest.fn(),
            cheerio: { load: jest.fn() },
            aiManager: { call: jest.fn() },
            rootDir: mockRootDir
        });

        // Mock filsystemet
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockImplementation((file) => {
            if (file.endsWith('radar.json')) return JSON.stringify({ 
                config: { radius: 30, baseCity: 'Aalborg', searchKeywords: ['embedded sw'] }, 
                targetCompanies: [{ name: 'TestCo' }],
                jobs: [] 
            });
            if (file.endsWith('brutto_cv.md')) return 'Mock CV';
            if (file.endsWith('ai_preferences.json')) return JSON.stringify({ 
                activeProvider: 'gemini', 
                providers: { gemini: { model: 'gemini-pro' } } 
            });
            return '';
        });

        // Mock søge-funktionen så vi ikke starter Chromium i unit tests
        radarService._searchJobindex = jest.fn().mockResolvedValue([]);
    });

    test('skal indlæse søgeord fra radar.json', async () => {
        const data = await radarService.getRadarData();
        expect(data.config.searchKeywords).toContain('embedded sw');
    });

    test('skal indlæse AI præferencer korrekt', async () => {
        const settings = await radarService._getAiSettings();
        expect(settings.provider).toBe('gemini');
    });

    test('skal håndtere AI-fallback svar uden at crashe (ingen keywords)', async () => {
        // Simuler et fallback-svar fra AiManager som mangler 'keywords'
        radarService.aiManager.call.mockResolvedValue({ 
            error: "Format fejl", 
            raw: "Dette er ikke JSON",
            company: "Ukendt" 
        });
        
        // Dette bør ikke kaste en fejl nu efter rettelsen (fordi vi tilføjer .keywords || [])
        await expect(radarService.refresh()).resolves.not.toThrow();
    });
});
