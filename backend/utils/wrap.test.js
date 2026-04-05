const wrap = require('./wrap');
const fs = require('fs');

jest.mock('fs');

describe('wrap()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        fs.readFileSync.mockReturnValue('<html><body><h1>{{BRUGER_NAVN}}</h1>{{BRUGER_ADRESSE_BLOK}}{{CONTENT}}</body></html>');
    });

    test('bør indsætte navn og indhold korrekt', () => {
        const html = wrap('Titel', 'Brødtekst', 'ansøgning', {}, { name: 'Test Bruger' });
        expect(html).toContain('Test Bruger');
        expect(html).toContain('Brødtekst');
    });

    test('bør håndtere adresse-opsplitning korrekt', () => {
        const candidate = { address: 'Vejnavn 1, 1234 By' };
        const html = wrap('Titel', 'Indhold', 'ansøgning', {}, candidate, 'da', {});
        expect(html).toContain('Vejnavn 1');
        expect(html).toContain('1234 By');
    });
});
