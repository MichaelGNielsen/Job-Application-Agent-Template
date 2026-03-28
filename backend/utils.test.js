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

const { wrap, parseCandidateInfo, extractSection, printToPdf, callLocalGemini, generateMasterDocs } = require('./utils');
const fs = require('fs');
const child_process = require('child_process');

// Mocks
jest.mock('fs');
jest.mock('child_process', () => ({
    exec: jest.fn((cmd, options, cb) => {
        const callback = typeof options === 'function' ? options : cb;
        callback(null, { stdout: 'Mocked output', stderr: '' });
    })
}));

describe('utils.js', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('wrap()', () => {
        beforeEach(() => {
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

    describe('parseCandidateInfo()', () => {
        test('bør udtrække info korrekt fra Markdown', () => {
            const brutto = 'Navn: Michael Nielsen\nAdresse: Testvej 1, 9000 Aalborg';
            const info = parseCandidateInfo(brutto);
            expect(info.name).toBe('Michael Nielsen');
            expect(info.address).toBe('Testvej 1, 9000 Aalborg');
        });
    });

    describe('extractSection()', () => {
        test('bør udtrække en sektion', () => {
            const res = '---TEST---内容';
            expect(extractSection(res, 'TEST')).toBe('内容');
        });
    });

    describe('printToPdf()', () => {
        test('bør returnere true ved succes', async () => {
            const success = await printToPdf('in.html', 'out.pdf');
            expect(success).toBe(true);
            expect(child_process.exec).toHaveBeenCalled();
        });
    });

    describe('callLocalGemini()', () => {
        test('bør returnere AI svar', async () => {
            const response = await callLocalGemini('prompt');
            expect(response).toBe('Mocked output');
        });
    });

    describe('generateMasterDocs()', () => {
        beforeEach(() => {
            fs.readFileSync.mockReturnValue('<html><body>{{CONTENT}}</body></html>');
            fs.existsSync.mockReturnValue(true);
        });

        test('bør køre hele flowet og returnere succes', async () => {
            const result = await generateMasterDocs('## Mit Master CV');
            expect(result.success).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(child_process.exec).toHaveBeenCalled();
        });
    });
});
