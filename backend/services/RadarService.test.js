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
        const prefs = await radarService._getAiPrefs();
        expect(prefs.activeProvider).toBe('gemini');
    });

    test('skal generere korrekt prompt med søgeord', async () => {
        const spy = jest.spyOn(radarService.aiManager, 'call').mockResolvedValue({ keywords: ['test'] });
        await radarService.refresh();
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining('embedded sw'),
            'radar_context',
            'gemini',
            true,
            'gemini-pro'
        );
    });
});
