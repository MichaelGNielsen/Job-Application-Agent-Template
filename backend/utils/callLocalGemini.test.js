const callLocalGemini = require('./callLocalGemini');
const child_process = require('child_process');
const fs = require('fs');

jest.mock('fs', () => ({
    writeFileSync: jest.fn(),
    existsSync: jest.fn(() => true),
    unlinkSync: jest.fn()
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

describe('callLocalGemini()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('bør returnere AI svar udenom køen', async () => {
        const response = await callLocalGemini('prompt');
        expect(response).toBe('Mocked output');
        expect(child_process.exec).toHaveBeenCalled();
    });
});
