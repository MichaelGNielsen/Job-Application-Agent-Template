const extractSection = require('./extractSection');

describe('extractSection()', () => {
    test('bør udtrække en sektion', () => {
        const res = '---TEST---\nIndhold';
        expect(extractSection(res, 'TEST')).toBe('Indhold');
    });
});
