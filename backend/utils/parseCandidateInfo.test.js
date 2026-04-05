const parseCandidateInfo = require('./parseCandidateInfo');

jest.mock('./logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('parseCandidateInfo()', () => {
    test('bør udtrække info korrekt fra Markdown', () => {
        const brutto = 'Navn: Michael Nielsen\nAdresse: Testvej 1, 9000 Aalborg';
        const info = parseCandidateInfo(brutto);
        expect(info.name).toBe('Michael Nielsen');
        expect(info.address).toBe('Testvej 1, 9000 Aalborg');
    });
});
