/**
 * Job Application Agent MGN - Services Unit Tests
 * Validerer den nye modulære arkitektur (v4.8.0).
 */

const { wrap, parseCandidateInfo, extractSection } = require('./document_service');
const { printToPdf } = require('./pdf_service');
const { callLocalGemini } = require('./ai_service');
const { generateMasterDocs } = require('./master_cv_service');
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

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

describe('Modular Services', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('document_service: wrap()', () => {
        beforeEach(() => {
            fs.readFileSync.mockReturnValue('<html><body><h1>{{BRUGER_NAVN}}</h1>{{BRUGER_ADRESSE_BLOK}}{{CONTENT}}</body></html>');
            fs.existsSync.mockReturnValue(true);
        });

        test('bør indsætte navn og indhold korrekt', () => {
            const html = wrap('Titel', 'Brødtekst', 'ansøgning', {}, { name: 'Test Bruger' }, 'da', {}, mockLogger);
            expect(html).toContain('Test Bruger');
            expect(html).toContain('Brødtekst');
        });
    });

    describe('document_service: parseCandidateInfo()', () => {
        test('bør udtrække info korrekt fra Markdown', () => {
            const brutto = 'Navn: Michael Nielsen\nAdresse: Testvej 1, 9000 Aalborg';
            const info = parseCandidateInfo(brutto, mockLogger);
            expect(info.name).toBe('Michael Nielsen');
            expect(info.address).toBe('Testvej 1, 9000 Aalborg');
        });
    });

    describe('document_service: extractSection()', () => {
        test('bør udtrække en sektion', () => {
            const res = '---TEST---Content';
            expect(extractSection(res, 'TEST')).toBe('Content');
        });
    });

    describe('pdf_service: printToPdf()', () => {
        test('bør returnere true ved succes', async () => {
            const success = await printToPdf('in.html', 'out.pdf', mockLogger);
            expect(success).toBe(true);
            expect(child_process.exec).toHaveBeenCalled();
        });
    });

    describe('ai_service: callLocalGemini()', () => {
        test('bør returnere AI svar', async () => {
            const response = await callLocalGemini('prompt', 'test-job', mockLogger);
            expect(response).toBe('Mocked output');
        });
    });

    describe('master_cv_service: generateMasterDocs()', () => {
        beforeEach(() => {
            fs.readFileSync.mockReturnValue('<html><body>{{CONTENT}}</body></html>');
            fs.existsSync.mockReturnValue(true);
        });

        test('bør køre hele flowet og returnere succes', async () => {
            const result = await generateMasterDocs('## Mit Master CV', mockLogger);
            expect(result.success).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(child_process.exec).toHaveBeenCalled();
        });
    });
});
