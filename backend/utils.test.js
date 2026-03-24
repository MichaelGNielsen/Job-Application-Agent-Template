/**
 * Job Application Agent Template
 * 
 * Designer: MGN (mgn@mgnielsen.dk)
 * Copyright (c) 2026 MGN. All rights reserved.
 * 
 * BEMÆRK: Denne kode anvender AI til generering og behandling.
 * Brugeren skal selv verificere, at resultatet er som forventet.
 * Softwaren leveres "som den er", uden nogen form for garanti.
 * Brug af softwaren sker på eget ansvar.
 */

const { wrap } = require('./utils');
const fs = require('fs');
const path = require('path');

// Mock fs.readFileSync to provide template content
jest.mock('fs');

describe('utils.js', () => {
    describe('wrap()', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            // Provide a simple template for testing
            fs.readFileSync.mockReturnValue('<html><head><title>{{DOC_TITLE}}</title></head><body><h1>{{NAME}}</h1><div class="address">{{ADDRESS_BLOCK}}</div><div class="content">{{CONTENT}}</div></body></html>');
        });

        test('bør indsætte navn og indhold korrekt', () => {
            const html = wrap('Titel', 'Brødtekst', 'ansøgning', {}, { name: 'Test Bruger' });
            
            expect(html).toContain('Test Bruger');
            expect(html).toContain('Brødtekst');
            expect(html).toContain('Titel - Test Bruger');
        });

        test('bør håndtere adresse-opsplitning korrekt', () => {
            const layoutMeta = { address: 'Vejnavn 1, 1234 By' };
            const html = wrap('Titel', 'Indhold', 'ansøgning', {}, { name: 'Test' }, 'da', layoutMeta);
            
            expect(html).toContain('<p>Vejnavn 1</p>');
            expect(html).toContain('1234 By');
            // Tjekker at datoen også er der (da det er en ansøgning)
            expect(html).toContain(new Date().getFullYear().toString());
        });

        test('bør erstatte [SCORE] tags med en pæn div', () => {
            const html = wrap('Titel', 'Resultat: [SCORE] 85% [/SCORE]', 'match', {}, { name: 'Test' });
            
            expect(html).toContain('<div class="match-score">Samlet Match Score: 85%</div>');
        });
    });
});
