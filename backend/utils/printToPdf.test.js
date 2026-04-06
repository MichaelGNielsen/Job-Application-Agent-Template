const printToPdf = require('./printToPdf');
const child_process = require('child_process');
const fs = require('fs');

jest.mock('fs', () => ({
    copyFileSync: jest.fn(),
    existsSync: jest.fn(() => true),
    unlinkSync: jest.fn(),
    statSync: jest.fn(() => ({ size: 1024 }))
}));

jest.mock('child_process', () => ({
    exec: jest.fn((cmd, options, cb) => {
        const callback = typeof options === 'function' ? options : cb;
        callback(null, { stdout: 'Mocked output', stderr: '' });
    })
}));

jest.mock('./logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
}));

describe('printToPdf()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('bør returnere true ved succes', async () => {
        const success = await printToPdf('in.html', 'out.pdf');
        expect(success).toBe(true);
        expect(child_process.exec).toHaveBeenCalled();
    });
});
